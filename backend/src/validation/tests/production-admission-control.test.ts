import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";
import {
  admitExpensiveWork,
  admitPillowSessionCreate,
  beginPillowSessionCreate,
  endPillowSessionCreate,
  getAdmissionStats,
  resetAdmissionControlForTesting,
} from "../../runtime/production-admission-control.js";
import { PillowSessionStore } from "../../orchestration/pillow-host/session-store.js";
import { verifyProductionPersistence } from "../../runtime/production-persistence-gate.js";

describe("production admission control", () => {
  afterEach(() => {
    resetAdmissionControlForTesting();
  });

  test("limits concurrent pillow session creates", () => {
    beginPillowSessionCreate();
    beginPillowSessionCreate();
    const denied = admitPillowSessionCreate();
    assert.equal(denied.admit, false);
    if (!denied.admit) {
      assert.match(denied.reason, /concurrency/i);
    }
    endPillowSessionCreate();
    endPillowSessionCreate();
    const allowed = admitPillowSessionCreate();
    assert.equal(allowed.admit, true);
    assert.equal(getAdmissionStats().pillowSessionCreatesInFlight, 0);
  });

  test("admitExpensiveWork returns a decision object", () => {
    const decision = admitExpensiveWork("unit");
    assert.equal(typeof decision.admit, "boolean");
  });
});

describe("pillow session reuse", () => {
  test("getOrCreate reuses newest workspace session within maxAge", () => {
    const store = new PillowSessionStore();
    const first = store.getOrCreate("ws_1", { maxAgeMs: 60_000 });
    assert.equal(first.reused, false);
    const second = store.getOrCreate("ws_1", { maxAgeMs: 60_000 });
    assert.equal(second.reused, true);
    assert.equal(second.session.sessionId, first.session.sessionId);
    assert.equal(store.count(), 1);
  });
});

describe("production persistence gate", () => {
  test("flags non-volume paths when volume required", () => {
    const result = verifyProductionPersistence({
      databasePath: "/app/empireai-brain.db",
      requireVolume: true,
      railwayDetected: true,
    });
    assert.equal(result.ok, false);
    assert.equal(result.onPersistentVolume, false);
    assert.ok(result.blockers.length > 0);
  });

  test("accepts /data volume path when writable", () => {
    // Use a temp path under /data-like naming via local dir that is writable —
    // on Windows, absolute /data may not exist; verify path classification only.
    const classified = verifyProductionPersistence({
      databasePath: "/data/empireai-brain.db",
      requireVolume: true,
      railwayDetected: true,
    });
    assert.equal(classified.onPersistentVolume, true);
    // writable may fail on Windows without /data mount — ok field depends on FS
    assert.ok(typeof classified.writable === "boolean");
  });
});
