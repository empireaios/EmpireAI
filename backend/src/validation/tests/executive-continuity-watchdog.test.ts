import assert from "node:assert/strict";
import { describe, test, before, after } from "node:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import ts from "typescript";
import {
  clearEventLoopLagAfterKnownBlock,
  getRecentEventLoopLagMs,
} from "../../runtime/event-loop-cooperative.js";
import {
  getExecutiveContinuityHealth,
  startExecutiveContinuityWatchdog,
  stopExecutiveContinuityWatchdogForTesting,
} from "../../runtime/executive-continuity-watchdog.js";

describe("Executive Continuity Watchdog", () => {
  let fixtureDir: string;
  before(() => {
    fixtureDir = mkdtempSync(path.join(tmpdir(), "empire-continuity-health-"));
    writeFileSync(path.join(fixtureDir, "package.json"), '{"type":"module"}');
    for (const name of ["continuity-heartbeat", "executive-continuity-watchdog-worker"]) {
      const source = readFileSync(new URL(`../../runtime/${name}.ts`, import.meta.url), "utf8");
      writeFileSync(path.join(fixtureDir, `${name}.js`), ts.transpileModule(source, {
        compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
      }).outputText);
    }
  });
  after(() => {
    stopExecutiveContinuityWatchdogForTesting();
    rmSync(fixtureDir, { recursive: true, force: true });
  });

  test("starts and reports continuity health snapshot", async () => {
    startExecutiveContinuityWatchdog({ workerFile: path.join(fixtureDir, "executive-continuity-watchdog-worker.js") });
    for (let i = 0; i < 150 && !getExecutiveContinuityHealth().watchdogRunning; i++) {
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    const health = getExecutiveContinuityHealth();
    assert.equal(health.watchdogEnabled, true);
    assert.equal(typeof health.eventLoopLagMs, "number");
    assert.ok(health.watchdogRunning);
    assert.ok(Array.isArray(health.alerts));
    assert.ok(health.lastHeartbeatAgeMs !== null && health.lastHeartbeatAgeMs >= 0 && health.lastHeartbeatAgeMs < 5_000);
    assert.equal(health.healthy, true);
  });

  test("clearEventLoopLagAfterKnownBlock drops ghost lag after sync export", () => {
    // Simulate post-export ghost sample without starting the interval monitor.
    clearEventLoopLagAfterKnownBlock("unit-test");
    assert.equal(getRecentEventLoopLagMs(), 0);
  });
});
