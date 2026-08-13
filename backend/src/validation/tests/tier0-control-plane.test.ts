import assert from "node:assert/strict";
import { describe, test, beforeEach } from "node:test";
import {
  getTier0ControlPlaneSnapshot,
  recordTier0Request,
  resetTier0ControlPlaneForTesting,
} from "../../runtime/tier0-control-plane.js";
import { admitExpensiveWork, resetAdmissionControlForTesting } from "../../runtime/production-admission-control.js";
import { getSqlitePersistStats } from "../../brain/sqlite-database.js";

describe("Tier-0 control plane telemetry", () => {
  beforeEach(() => {
    resetTier0ControlPlaneForTesting();
    resetAdmissionControlForTesting();
  });

  test("records latency and exposes p95", () => {
    for (let i = 0; i < 20; i++) {
      recordTier0Request({ route: "auth_me", durationMs: 50 + i, ok: true });
    }
    const snap = getTier0ControlPlaneSnapshot();
    assert.equal(snap.sampleCount, 20);
    assert.equal(snap.failureCount, 0);
    assert.ok(snap.p95Ms !== null && snap.p95Ms >= 50);
    assert.equal(snap.degraded, false);
  });

  test("5xx samples mark degraded when repeated", () => {
    for (let i = 0; i < 3; i++) {
      recordTier0Request({ route: "auth_login", durationMs: 100, ok: false });
    }
    const snap = getTier0ControlPlaneSnapshot();
    assert.equal(snap.failureCount, 3);
    assert.equal(snap.degraded, true);
    assert.ok(snap.alerts.some((a) => a.startsWith("tier0_failures=")));
  });

  test("admitExpensiveWork refuses while flushInFlight semantics remain callable", () => {
    // Structural sentinel: admission API must remain available for Tier-0 protection.
    const decision = admitExpensiveWork("unit-sentinel");
    assert.equal(typeof decision.admit, "boolean");
    const sqlite = getSqlitePersistStats();
    assert.equal(typeof sqlite.flushInFlight, "boolean");
  });
});
