import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { buildApp } from "../../app.js";
import { getDatabase, resetDatabaseInstance } from "../../brain/database.js";
import { configureValidationEnvironment } from "../harness.js";

before(() => { configureValidationEnvironment(); resetDatabaseInstance(); });
after(() => { resetDatabaseInstance(); });

test("application shutdown waits for the existing database save", async (t) => {
  const empire = await buildApp({ startWorkers: false, startScheduler: false, pillowEnabled: false });
  let saved!: () => void;
  let entered!: () => void;
  const called = new Promise<void>((resolve) => { entered = resolve; });
  const saving = new Promise<void>((resolve) => { saved = resolve; });
  const save = t.mock.method(getDatabase(), "requestCriticalPersist", () => { entered(); return saving; });
  let acknowledged = false;
  const shutdown = empire.shutdown().then(() => { acknowledged = true; });
  try {
    await called;
    assert.equal(acknowledged, false);
  } finally {
    saved();
    await shutdown;
    save.mock.restore();
  }
  assert.equal(acknowledged, true);
});

test("application shutdown propagates disk-save failure instead of reporting success", async (t) => {
  const empire = await buildApp({ startWorkers: false, startScheduler: false, pillowEnabled: false });
  const save = t.mock.method(getDatabase(), "requestCriticalPersist", async () => {
    throw new Error("test final save failure");
  });
  try { await assert.rejects(empire.shutdown(), /test final save failure/); }
  finally { save.mock.restore(); }
});
