import assert from "node:assert/strict";
import { after, afterEach, before, describe, test } from "node:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { Worker } from "node:worker_threads";
import ts from "typescript";
import { bindSqliteFlushGuard, EmpireDatabase, sqlJsEngine } from "../../brain/sqlite-database.js";
import {
  CONTINUITY_BUFFER_BYTES, attachContinuityHeartbeat, evaluateContinuityPoll,
  monotonicNowMs, readContinuityHeartbeat, writeContinuityHeartbeat,
} from "../../runtime/continuity-heartbeat.js";
import {
  getExecutiveContinuityHealth, startExecutiveContinuityWatchdog,
  stopExecutiveContinuityWatchdogForTesting,
} from "../../runtime/executive-continuity-watchdog.js";

let fixtureDir: string;
let workerFile: string;
const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const fresh = () => attachContinuityHeartbeat(new SharedArrayBuffer(CONTINUITY_BUFFER_BYTES));
function poll(ageMs: number | null, extra: Partial<Parameters<typeof evaluateContinuityPoll>[0]> = {}) {
  return evaluateContinuityPoll({
    reading: { ageMs, error: ageMs === null ? "heartbeat_missing" : null, nowMs: 1_000_000 },
    startedAtMs: 0, bootGraceMs: 180_000, stallExitMs: 45_000,
    flushInFlight: false, maxFlushGuardMs: 600_000, invalidSinceMs: null, ...extra,
  });
}

before(() => {
  // Compile the real two-file worker, not a replacement that mirrors its behavior.
  fixtureDir = mkdtempSync(path.join(tmpdir(), "empire-watchdog-held-"));
  writeFileSync(path.join(fixtureDir, "package.json"), '{"type":"module"}');
  for (const name of ["continuity-heartbeat", "executive-continuity-watchdog-worker"]) {
    const source = readFileSync(new URL(`../../runtime/${name}.ts`, import.meta.url), "utf8");
    const output = ts.transpileModule(source, {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
    }).outputText;
    writeFileSync(path.join(fixtureDir, `${name}.js`), output);
  }
  workerFile = path.join(fixtureDir, "executive-continuity-watchdog-worker.js");
});
afterEach(() => stopExecutiveContinuityWatchdogForTesting());
after(() => rmSync(fixtureDir, { recursive: true, force: true }));

describe("continuity heartbeat clock and real off-thread recovery", () => {
  test("preserves the failed epoch and both signed 32-bit wrap boundaries", () => {
    const failedEpoch = Date.parse("2026-09-20T23:57:31Z");
    const legacy = new Int32Array(new SharedArrayBuffer(8));
    Atomics.store(legacy, 0, failedEpoch);
    assert.equal(Atomics.load(legacy, 0), -1052711432);
    for (const tick of [0, 2147483647, 2147483648, 4294967295, 4294967296, failedEpoch]) {
      const view = fresh();
      writeContinuityHeartbeat(view, BigInt(tick));
      assert.equal(Atomics.load(view.timestamp, 0), BigInt(tick));
      assert.deepEqual(readContinuityHeartbeat(view, BigInt(tick) + 17n), {
        ageMs: 17, error: null, nowMs: tick + 17,
      });
    }
  });

  test("keeps the SQLite in-flight flag separate from the atomic timestamp", () => {
    const view = fresh();
    Atomics.store(view.flags, 1, 1);
    writeContinuityHeartbeat(view, 1789948651000n);
    assert.equal(Atomics.load(view.flags, 1), 1);
    Atomics.store(view.flags, 1, 0);
    assert.equal(Atomics.load(view.timestamp, 0), 1789948651000n);
    assert.equal(Atomics.load(view.flags, 0), 1);
  });

  test("does not turn missing, negative, future, or unsafe clocks into healthy ages", () => {
    const view = fresh();
    assert.equal(readContinuityHeartbeat(view, 10n).error, "heartbeat_missing");
    writeContinuityHeartbeat(view, 0n);
    assert.equal(readContinuityHeartbeat(view, 0n).ageMs, 0);
    Atomics.store(view.timestamp, 0, -1n);
    assert.equal(readContinuityHeartbeat(view, 10n).error, "heartbeat_clock_invalid");
    Atomics.store(view.timestamp, 0, 11n);
    assert.equal(readContinuityHeartbeat(view, 10n).error, "heartbeat_clock_invalid");
    assert.equal(readContinuityHeartbeat(view, 9007199254740992n).error, "invalid_monotonic_clock");
    assert.throws(() => writeContinuityHeartbeat(view, -1n), /Invalid monotonic heartbeat/);
    assert.throws(() => attachContinuityHeartbeat(new SharedArrayBuffer(8)), /Invalid continuity/);
  });

  test("wall-clock rollback and forward jumps do not alter heartbeat age", (t) => {
    let wallClock = 0;
    t.mock.method(Date, "now", () => wallClock);
    const view = fresh();
    writeContinuityHeartbeat(view);
    wallClock = 9_000_000_000_000;
    const forward = readContinuityHeartbeat(view);
    wallClock = -9_000_000_000_000;
    const backward = readContinuityHeartbeat(view);
    assert.equal(forward.error, null);
    assert.equal(backward.error, null);
    assert.ok(forward.ageMs! >= 0 && forward.ageMs! < 1_000);
    assert.ok(backward.ageMs! >= forward.ageMs! && backward.ageMs! < 1_000);
  });

  test("preserves exact stall, cold-start, and SQLite flush hard-cap boundaries", () => {
    assert.equal(poll(44_999).terminate, false);
    assert.equal(poll(45_000).terminate, true);
    assert.equal(poll(200_000, { startedAtMs: 820_001 }).reason, "boot_grace");
    assert.equal(poll(200_000, { startedAtMs: 820_000 }).terminate, true);
    assert.equal(poll(599_999, { flushInFlight: true }).reason, "sqlite_flush_guard");
    assert.equal(poll(600_000, { flushInFlight: true }).terminate, true);
  });

  test("allows a bounded invalid-reading recovery window and resets it after a valid beat", () => {
    const first = poll(null);
    assert.equal(first.terminate, false);
    assert.equal(first.invalidSinceMs, 1_000_000);
    assert.equal(poll(null, { invalidSinceMs: 955_000 }).terminate, true);
    assert.equal(poll(null, { invalidSinceMs: 955_000, flushInFlight: true }).terminate, false);
    assert.equal(poll(null, { invalidSinceMs: 400_001, flushInFlight: true }).terminate, false);
    assert.equal(poll(null, { invalidSinceMs: 400_000, flushInFlight: true }).terminate, true);
    assert.equal(poll(5, { invalidSinceMs: 955_000 }).invalidSinceMs, null);
  });

  for (const shutdown of [false, true]) {
    test(`${shutdown ? "shutdown" : "async"} SQLite export publishes liveness before releasing its guard`, async (t) => {
      const view = fresh();
      writeContinuityHeartbeat(view);
      const db = new EmpireDatabase(path.join(fixtureDir, `flush-handoff-${shutdown}.db`));
      db.exec("CREATE TABLE proof (id INTEGER PRIMARY KEY)");
      db.exec("INSERT INTO proof VALUES (1)");
      let completionCount = 0;
      bindSqliteFlushGuard(view.flags, () => {
        assert.equal(Atomics.load(view.flags, 1), 1, "guard must still be held at completion handoff");
        writeContinuityHeartbeat(view);
        completionCount++;
      });
      const originalExport = sqlJsEngine.Database.prototype.export;
      const exportMock = t.mock.method(sqlJsEngine.Database.prototype, "export", function (this: InstanceType<typeof sqlJsEngine.Database>) {
        assert.equal(Atomics.load(view.flags, 1), 1);
        // Hold the exact post-export state of a long export without waiting 45s.
        writeContinuityHeartbeat(view, monotonicNowMs() - 50_000n);
        return originalExport.call(this);
      });
      try {
        if (shutdown) db.close();
        else await db.requestCriticalPersist();
        assert.equal(completionCount, 1);
        const flushInFlight = Atomics.load(view.flags, 1) === 1;
        const reading = readContinuityHeartbeat(view);
        assert.equal(flushInFlight, false);
        assert.ok(reading.ageMs !== null && reading.ageMs < 5_000);
        assert.equal(evaluateContinuityPoll({ reading, startedAtMs: 0, bootGraceMs: 0,
          stallExitMs: 45_000, flushInFlight, maxFlushGuardMs: 600_000, invalidSinceMs: null }).terminate, false);
        const disk = new sqlJsEngine.Database(readFileSync(path.join(fixtureDir, `flush-handoff-${shutdown}.db`)));
        try { assert.deepEqual(disk.exec("SELECT id FROM proof")[0]?.values, [[1]]); }
        finally { disk.close(); }
      } finally {
        exportMock.mock.restore();
        bindSqliteFlushGuard(null);
        db.close();
      }
    });
  }

  test("a failed worker remains unhealthy even while the main heartbeat timer still runs", async () => {
    assert.equal(getExecutiveContinuityHealth().healthy, false);
    const brokenWorker = path.join(fixtureDir, "broken-worker.js");
    writeFileSync(brokenWorker, 'throw new Error("held fixture worker failure");');
    startExecutiveContinuityWatchdog({ workerFile: brokenWorker });
    for (let i = 0; i < 150; i++) {
      if (getExecutiveContinuityHealth().alerts.some((v) => /watchdog_worker_(error|exit)/.test(v))) break;
      await delay(20);
    }
    const health = getExecutiveContinuityHealth();
    assert.equal(health.watchdogRunning, false);
    assert.equal(health.healthy, false);
    assert.ok(health.alerts.some((v) => /watchdog_worker_(error|exit)/.test(v)));
    assert.ok(health.lastHeartbeatAgeMs !== null && health.lastHeartbeatAgeMs < 5_000);
  });

  test("requires a ready handshake and survives old-worker exit callbacks after reset", async () => {
    startExecutiveContinuityWatchdog({ workerFile });
    assert.equal(getExecutiveContinuityHealth().watchdogRunning, false);
    stopExecutiveContinuityWatchdogForTesting();
    startExecutiveContinuityWatchdog({ workerFile });
    for (let i = 0; i < 150 && !getExecutiveContinuityHealth().watchdogRunning; i++) await delay(20);
    await delay(50);
    const health = getExecutiveContinuityHealth();
    assert.equal(health.watchdogRunning, true);
    assert.equal(health.healthy, true);
    assert.ok(health.lastHeartbeatAgeMs !== null && health.lastHeartbeatAgeMs < 5_000);
    stopExecutiveContinuityWatchdogForTesting();
    assert.equal(getExecutiveContinuityHealth().watchdogRunning, false);
    assert.equal(getExecutiveContinuityHealth().lastHeartbeatAgeMs, null);
    assert.equal(getExecutiveContinuityHealth().healthy, false);
  });

  test("the actual worker leaves a current monotonic heartbeat alive", async () => {
    const sharedBuffer = new SharedArrayBuffer(CONTINUITY_BUFFER_BYTES);
    const view = attachContinuityHeartbeat(sharedBuffer);
    writeContinuityHeartbeat(view);
    const actualWorker = new Worker(workerFile, { workerData: {
      sharedBuffer, stallExitMs: 60_000, pollMs: 500, bootGraceMs: 0, startedAtMs: Number(monotonicNowMs()),
    } });
    try {
      await new Promise<void>((resolve, reject) => {
        actualWorker.once("message", (message) => {
          assert.equal(message.type, "continuity_watchdog_ready"); resolve();
        });
        actualWorker.once("error", reject);
      });
      await delay(550);
      assert.ok(actualWorker.threadId > 0);
      assert.equal(readContinuityHeartbeat(view).error, null);
    } finally { await actualWorker.terminate(); }
  });

  test("the actual worker terminates an isolated process whose main thread cannot run callbacks", { timeout: 12_000 }, async () => {
    const blockedMain = path.join(fixtureDir, "blocked-main.js");
    writeFileSync(blockedMain, `
      import { Worker } from 'node:worker_threads';
      import { writeSync } from 'node:fs';
      import { CONTINUITY_BUFFER_BYTES, attachContinuityHeartbeat, monotonicNowMs, writeContinuityHeartbeat } from './continuity-heartbeat.js';
      const sharedBuffer = new SharedArrayBuffer(CONTINUITY_BUFFER_BYTES);
      const view = attachContinuityHeartbeat(sharedBuffer);
      writeContinuityHeartbeat(view);
      const worker = new Worker(new URL('./executive-continuity-watchdog-worker.js', import.meta.url), {
        workerData: { sharedBuffer, stallExitMs: 5000, pollMs: 500, bootGraceMs: 0, startedAtMs: Number(monotonicNowMs()) }
      });
      worker.once('message', () => {
        writeContinuityHeartbeat(view);
        writeSync(1, 'BLOCKING_MAIN\\n');
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 30000);
      });
      worker.on('exit', () => { writeSync(1, 'MAIN_CALLBACK_RAN\\n'); process.exit(99); });
    `);
    const startedAt = performance.now();
    const child = spawn(process.execPath, [blockedMain], { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += String(chunk); });
    child.stderr.on("data", (chunk) => { stderr += String(chunk); });
    const safety = setTimeout(() => child.kill("SIGKILL"), 10_000);
    try {
      const result = await new Promise<{ code: number | null; signal: NodeJS.Signals | null }>((resolve, reject) => {
        child.once("error", reject);
        child.once("close", (code, signal) => resolve({ code, signal }));
      });
      assert.deepEqual(result, { code: null, signal: "SIGKILL" });
      assert.match(stdout, /BLOCKING_MAIN/);
      assert.doesNotMatch(stdout, /MAIN_CALLBACK_RAN/);
      const receipt = stderr.split("\n").filter(Boolean).map((line) => JSON.parse(line))
        .find((row) => row.event === "executive_continuity_watchdog_exit");
      assert.equal(receipt.reason, "heartbeat_stalled");
      assert.ok(receipt.stalledForMs >= 5_000 && receipt.stalledForMs < 8_000);
      assert.ok(performance.now() - startedAt < 9_000, "must recover before the test safety timer");
    } finally {
      clearTimeout(safety);
      if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
    }
  });
});
