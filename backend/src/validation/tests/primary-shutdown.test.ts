import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { primaryShutdownTimeoutMs } from "../../runtime/primary-shutdown.js";

const controllerUrl = new URL("../../runtime/primary-shutdown.ts", import.meta.url).href;
const loaderUrl = import.meta.resolve("tsx");

async function startFixture(mode: "save" | "hang" | "fail" | "no-child") {
  const dir = await mkdtemp(path.join(tmpdir(), "empire-primary-shutdown-"));
  const workerPath = path.join(dir, "worker.mjs");
  const parentPath = path.join(dir, "parent.mjs");
  const marker = path.join(dir, "persisted.json");
  const log = path.join(dir, "events.jsonl");
  await writeFile(workerPath, `
    import fs from 'node:fs';
    const record = (event) => fs.appendFileSync(${JSON.stringify(log)}, JSON.stringify({event})+'\\n');
    let stopping=false;
    process.on('SIGTERM', () => {
      if(stopping) return; stopping=true; record('child_signal');
      if (${JSON.stringify(mode)} === 'hang') return;
      setTimeout(() => {
        if (${JSON.stringify(mode)} === 'fail') process.exit(1);
        const fd=fs.openSync(${JSON.stringify(marker)},'w',0o600);
        fs.writeFileSync(fd, JSON.stringify({pendingMutation:'saved-on-shutdown'}));
        fs.fsyncSync(fd); fs.closeSync(fd); record('child_saved'); process.exit(0);
      }, 200);
    });
    setInterval(()=>{},1000); process.stdout.write('ready\\n');
  `);
  await writeFile(parentPath, `
    import fs from 'node:fs';
    import http from 'node:http';
    import {spawn} from 'node:child_process';
    import {installPrimaryShutdown} from ${JSON.stringify(controllerUrl)};
    const record=(event)=>fs.appendFileSync(${JSON.stringify(log)},JSON.stringify({event})+'\\n');
    let child=null;
    const server=http.createServer((_q,r)=>r.end('ready'));
    const controller=installPrimaryShutdown({
      getChild:()=>child,
      stopBackground:async()=>{record('sweeper_stop');await new Promise(r=>setTimeout(r,30));record('sweeper_settled');},
      closeServer:()=>new Promise((resolve,reject)=>server.close(e=>e?reject(e):resolve())),
      disconnect:()=>record('redis_disconnect'),
      report:(event)=>record(event),timeoutMs:1000,
    });
    server.listen(0,'127.0.0.1',()=>{
      if(${JSON.stringify(mode)}==='no-child'){
        controller.schedule(()=>record('late_spawn'),300);
        process.stdout.write(JSON.stringify({port:server.address().port,childPid:null})+'\\n');return;
      }
      child=spawn(process.execPath,[${JSON.stringify(workerPath)}],{stdio:['ignore','pipe','inherit']});
      child.once('exit',()=>controller.schedule(()=>record('respawn'),0));
      child.stdout.once('data',()=>process.stdout.write(JSON.stringify({port:server.address().port,childPid:child.pid})+'\\n'));
    });
  `);
  const parent = spawn(process.execPath, ["--import", loaderUrl, parentPath], {
    stdio: ["ignore", "pipe", "pipe"],
  });
  let stderr = "";
  parent.stderr.on("data", (chunk) => { stderr += String(chunk); });
  const exited = once(parent, "exit");
  let timer: NodeJS.Timeout | undefined;
  const ready = await Promise.race([
    once(parent.stdout, "data").then(([chunk]) => JSON.parse(String(chunk)) as { port: number; childPid: number | null }),
    new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error(`fixture did not start: ${stderr}`)), 10_000); }),
  ]).finally(() => { if (timer) clearTimeout(timer); });
  return {
    parent, exited, ready, marker,
    events: async () => (await readFile(log, "utf8")).trim().split("\n").map((s) => JSON.parse(s).event as string),
    cleanup: async () => {
      if (parent.exitCode === null && parent.signalCode === null) parent.kill("SIGKILL");
      if (ready.childPid) { try { process.kill(ready.childPid, "SIGKILL"); } catch {} }
      await rm(dir, { recursive: true, force: true });
    },
  };
}

test("real primary SIGTERM drains, forwards to child, waits for disk save and suppresses respawn", { timeout: 15_000 }, async () => {
  const fixture = await startFixture("save");
  try {
    assert.equal((await fetch(`http://127.0.0.1:${fixture.ready.port}`)).status, 200);
    fixture.parent.kill("SIGTERM");
    await new Promise((resolve) => setTimeout(resolve, 80));
    assert.equal(fixture.parent.exitCode, null, "parent must wait for child's pending persistence");
    fixture.parent.kill("SIGINT"); // repeated signal cannot abort the graceful save
    assert.deepEqual(await fixture.exited, [0, null]);
    assert.deepEqual(JSON.parse(await readFile(fixture.marker, "utf8")), { pendingMutation: "saved-on-shutdown" });
    assert.deepEqual(await fixture.events(), ["sweeper_stop", "sweeper_settled", "child_signal", "child_saved", "primary_shutdown_complete", "redis_disconnect"]);
  } finally { await fixture.cleanup(); }
});

test("a hung child is force terminated at deadline and is never reported successfully saved", { timeout: 15_000 }, async () => {
  const fixture = await startFixture("hang");
  try {
    fixture.parent.kill("SIGTERM");
    assert.deepEqual(await fixture.exited, [1, null]);
    await assert.rejects(readFile(fixture.marker), { code: "ENOENT" });
    const events = await fixture.events();
    assert.ok(events.includes("primary_shutdown_deadline_exceeded"));
    assert.ok(!events.includes("primary_shutdown_complete"));
    assert.ok(!events.includes("respawn"));
  } finally { await fixture.cleanup(); }
});

test("child save failure exits parent nonzero and preserves failure rather than claiming success", { timeout: 15_000 }, async () => {
  const fixture = await startFixture("fail");
  try {
    fixture.parent.kill("SIGINT");
    assert.deepEqual(await fixture.exited, [1, null]);
    assert.ok((await fixture.events()).includes("primary_shutdown_failed"));
    await assert.rejects(readFile(fixture.marker), { code: "ENOENT" });
  } finally { await fixture.cleanup(); }
});

test("shutdown during delayed worker start cancels the pending spawn", { timeout: 15_000 }, async () => {
  const fixture = await startFixture("no-child");
  try {
    fixture.parent.kill("SIGTERM");
    assert.deepEqual(await fixture.exited, [0, null]);
    assert.ok(!(await fixture.events()).includes("late_spawn"));
  } finally { await fixture.cleanup(); }
});

test("shutdown grace is finite and bounded even with invalid configuration", () => {
  assert.equal(primaryShutdownTimeoutMs("garbage"), 30_000);
  assert.equal(primaryShutdownTimeoutMs("Infinity"), 30_000);
  assert.equal(primaryShutdownTimeoutMs("-1"), 1_000);
  assert.equal(primaryShutdownTimeoutMs("900000"), 120_000);
});
