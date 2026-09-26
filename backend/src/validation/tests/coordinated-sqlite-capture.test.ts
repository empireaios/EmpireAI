import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import { EmpireDatabase } from "../../brain/sqlite-database.js";
import { withQuiescedBrainAndShadowCapture } from "../../orchestration/shadow-ceo-integration/coordinated-sqlite-capture.js";
import { openShadowCeoRepository, runVerticalSliceDemo } from "../../orchestration/shadow-ceo/index.js";

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
