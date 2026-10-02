import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import { withExclusiveNativeMissionCapture } from "../../runtime/native-store-capture.js";

const tryWrite = (filename: string) => spawnSync(process.execPath, ["-e", `
  const { DatabaseSync } = require('node:sqlite');
  const db = new DatabaseSync(process.argv[1], { timeout: 0 });
  try { db.exec('BEGIN IMMEDIATE; UPDATE mission_snapshot SET value=2; COMMIT'); }
  catch (e) { process.stderr.write(String(e)); process.exitCode=7; }
  finally { db.close(); }
`, filename], { encoding: "utf8", timeout: 5000 });

test("existing native mission stores are locked across asynchronous disk copy and released", async t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "native-capture-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const primary = path.join(dir, "brain.db");
  const mission = primary + ".missions.sqlite";
  const execution = primary + ".mission-execution.sqlite";
  for (const [filename, id, version, ddl] of [
    [mission, 0x454d5352, 3, "CREATE TABLE mission_snapshot(value INTEGER); INSERT INTO mission_snapshot VALUES (1)"],
    [execution, 0x454d4558, 1, "CREATE TABLE execution_events(value INTEGER); CREATE TABLE execution_jobs(value INTEGER); CREATE TABLE execution_meta(value INTEGER)"],
  ] as const) {
    const db = new DatabaseSync(filename);
    db.exec(`${ddl}; PRAGMA application_id=${id}; PRAGMA user_version=${version};`);
    db.close();
  }
  await withExclusiveNativeMissionCapture(primary, async () => {
    const denied = tryWrite(mission);
    assert.equal(denied.status, 7);
    assert.match(denied.stderr, /database is locked/);
    for (const source of [mission, execution]) {
      const copy = source + ".copy";
      fs.copyFileSync(source, copy);
      const db = new DatabaseSync(copy, { readOnly: true });
      assert.equal(db.prepare("PRAGMA quick_check").get()?.quick_check, "ok");
      db.close();
    }
    await Promise.resolve();
    assert.equal(tryWrite(mission).status, 7);
    await assert.rejects(withExclusiveNativeMissionCapture(primary, () => {
      throw new Error("overlapping capture reached readback");
    }), /lock refused|database is locked/);
  });
  assert.equal(tryWrite(mission).status, 0);
  const db = new DatabaseSync(mission, { readOnly: true });
  assert.equal(db.prepare("SELECT value FROM mission_snapshot").get()?.value, 2);
  db.close();
  await assert.rejects(withExclusiveNativeMissionCapture(primary, () => {
    throw new Error("readback refused");
  }), /readback refused/);
  assert.equal(tryWrite(mission).status, 0, "callback failure releases both native locks");
});

test("missing, alien and overlapping native stores refuse capture without callback", async t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "native-refusal-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const primary = path.join(dir, "brain.db");
  let called = false;
  await assert.rejects(withExclusiveNativeMissionCapture(primary, () => { called = true; }), /ENOENT/);
  assert.equal(called, false);
  const alien = new DatabaseSync(primary + ".missions.sqlite");
  alien.exec("CREATE TABLE unrelated(value INTEGER)"); alien.close();
  await assert.rejects(withExclusiveNativeMissionCapture(primary, () => { called = true; }), /identity or integrity/);
  assert.equal(called, false);
});
