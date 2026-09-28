import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import { buildApp } from "../../app.js";
import { getDatabase, resetDatabaseInstance } from "../../brain/database.js";
import { EmpireDatabase } from "../../brain/sqlite-database.js";
import { withQuiescedBrainAndShadowCapture } from "../../orchestration/shadow-ceo-integration/coordinated-sqlite-capture.js";
import { openShadowCeoRepository, runVerticalSliceDemo } from "../../orchestration/shadow-ceo/index.js";
import { configureValidationEnvironment } from "../harness.js";

test("application local drain saves both RAM-backed SQL handles before caller readback", async t => {
  configureValidationEnvironment();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "app-local-capture-"));
  const primaryFile = path.join(dir, "brain.db");
  const shadowFile = path.join(dir, "shadow.db");
  process.env.DATABASE_PATH = primaryFile;
  const empire = await buildApp({ startWorkers: false, startScheduler: false, pillowEnabled: false, earlyListen: true });
  const shadow = openShadowCeoRepository({ dbPath: shadowFile });
  t.after(async () => {
    shadow.close();
    await empire.shutdown();
    resetDatabaseInstance();
    delete process.env.DATABASE_PATH;
    fs.rmSync(dir, { recursive: true, force: true });
  });
  const primary = getDatabase();
  primary.exec("CREATE TABLE capture_local_evidence (value TEXT)");
  primary.prepare("INSERT INTO capture_local_evidence VALUES ('pending RAM')").run();
  const slice = runVerticalSliceDemo({ repo: shadow, workspaceId: "ws_local_capture", runKey: "pending" });

  await empire.withDrainedLocalSqliteCapture(shadow, () => {
    assert.throws(() => primary.exec("DELETE FROM capture_local_evidence"), /quiesced/);
    assert.throws(() => runVerticalSliceDemo({ repo: shadow, workspaceId: "ws_local_capture", runKey: "blocked" }), /quiesced/);
    const brainCopy = path.join(dir, "brain.copy.db");
    const shadowCopy = path.join(dir, "shadow.copy.db");
    fs.copyFileSync(primaryFile, brainCopy);
    fs.copyFileSync(shadowFile, shadowCopy);
    const b = new DatabaseSync(brainCopy, { readOnly: true });
    const s = new DatabaseSync(shadowCopy, { readOnly: true });
    try {
      assert.equal(b.prepare("SELECT value FROM capture_local_evidence").get()?.value, "pending RAM");
      assert.ok(Number(s.prepare("SELECT COUNT(*) AS n FROM shadow_ceo_records WHERE objective_id = ?")
        .get(slice.objectiveId)?.n) >= 12);
    } finally { b.close(); s.close(); }
  });
});

test("both open SQL.js handles save RAM and refuse writes through one verified capture", async t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "two-handle-capture-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const primaryFile = path.join(dir, "brain.db");
  const shadowFile = path.join(dir, "shadow.db");
  const primary = new EmpireDatabase(primaryFile);
  const shadow = openShadowCeoRepository({ dbPath: shadowFile });
  t.after(() => { shadow.close(); primary.close(); });
  primary.exec("CREATE TABLE checkpoint_evidence (value TEXT)");
  primary.prepare("INSERT INTO checkpoint_evidence VALUES ('RAM record')").run();
  const slice = runVerticalSliceDemo({ repo: shadow, workspaceId: "ws_two_handle", runKey: "ram-only" });
  const count = shadow.countByObjective(slice.objectiveId);
  assert.ok(count >= 12);
  assert.equal(fs.existsSync(primaryFile), false);
  assert.equal(fs.existsSync(shadowFile), false);

  await withQuiescedBrainAndShadowCapture(primary, shadow, () => {
    assert.throws(() => primary.prepare("INSERT INTO checkpoint_evidence VALUES ('blocked')").run(), /quiesced/);
    assert.throws(() => runVerticalSliceDemo({ repo: shadow, workspaceId: "ws_two_handle", runKey: "blocked" }), /quiesced/);
    fs.copyFileSync(primaryFile, path.join(dir, "brain.copy.db"));
    fs.copyFileSync(shadowFile, path.join(dir, "shadow.copy.db"));
    const b = new DatabaseSync(path.join(dir, "brain.copy.db"), { readOnly: true });
    const s = new DatabaseSync(path.join(dir, "shadow.copy.db"), { readOnly: true });
    try {
      assert.equal(b.prepare("SELECT value FROM checkpoint_evidence").get()?.value, "RAM record");
      assert.equal(s.prepare("SELECT COUNT(*) AS n FROM shadow_ceo_records WHERE objective_id = ?")
        .get(slice.objectiveId)?.n, count);
    } finally { s.close(); b.close(); }
  });
  await assert.rejects(withQuiescedBrainAndShadowCapture(primary, shadow,
    () => { throw new Error("copy integrity refused"); }), /copy integrity refused/);
  primary.prepare("INSERT INTO checkpoint_evidence VALUES ('resumed')").run();
  const later = runVerticalSliceDemo({ repo: shadow, workspaceId: "ws_two_handle", runKey: "resumed" });
  assert.ok(shadow.countByObjective(later.objectiveId) >= 12);
});

test("Shadow CEO writes are fenced before the first Brain save yields", async t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "capture-before-yield-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const primary = new EmpireDatabase(path.join(dir, "brain.db"));
  const shadow = openShadowCeoRepository({ dbPath: path.join(dir, "shadow.db") });
  t.after(() => { shadow.close(); primary.close(); });
  primary.exec("CREATE TABLE evidence (id INTEGER)");
  let entered!: () => void;
  let resume!: () => void;
  const saveEntered = new Promise<void>(resolve => { entered = resolve; });
  const saveCanFinish = new Promise<void>(resolve => { resume = resolve; });
  t.after(() => resume());
  const actualSave = primary.requestCriticalPersist.bind(primary);
  t.mock.method(primary, "requestCriticalPersist", async () => {
    entered();
    await saveCanFinish;
    return actualSave();
  });
  const capture = withQuiescedBrainAndShadowCapture(primary, shadow, () => "saved");
  await saveEntered;
  assert.throws(() => primary.exec("INSERT INTO evidence VALUES (1)"), /quiesced/);
  assert.throws(() => runVerticalSliceDemo({
    repo: shadow, workspaceId: "ws_before_yield", runKey: "blocked",
  }), /quiesced/, "second handle must already be fenced during the first save");
  resume();
  assert.equal(await capture, "saved");
  const result = runVerticalSliceDemo({ repo: shadow, workspaceId: "ws_before_yield", runKey: "resumed" });
  assert.ok(shadow.countByObjective(result.objectiveId) >= 12);
});
