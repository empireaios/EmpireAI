import assert from "node:assert/strict";
import { describe, test, after } from "node:test";
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
  after(() => {
    stopExecutiveContinuityWatchdogForTesting();
  });

  test("starts and reports continuity health snapshot", async () => {
    startExecutiveContinuityWatchdog();
    await new Promise((r) => setTimeout(r, 50));
    const health = getExecutiveContinuityHealth();
    assert.equal(health.watchdogEnabled, true);
    assert.equal(typeof health.eventLoopLagMs, "number");
    assert.ok(health.watchdogRunning);
    assert.ok(Array.isArray(health.alerts));
    assert.ok(health.lastHeartbeatAgeMs === null || health.lastHeartbeatAgeMs >= 0);
  });

  test("clearEventLoopLagAfterKnownBlock drops ghost lag after sync export", () => {
    // Simulate post-export ghost sample without starting the interval monitor.
    clearEventLoopLagAfterKnownBlock("unit-test");
    assert.equal(getRecentEventLoopLagMs(), 0);
  });
});
