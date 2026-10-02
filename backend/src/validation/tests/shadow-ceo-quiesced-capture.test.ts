import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { openShadowCeoRepository, runVerticalSliceDemo } from "../../orchestration/shadow-ceo/index.js";

test("running Shadow CEO SQLite handle saves its RAM records while its verified disk copy is fenced", async t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "shadow-capture-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const source = path.join(dir, "shadow.db");
  const copy = path.join(dir, "shadow-copied.db");
  const repo = openShadowCeoRepository({ dbPath: source });
  t.after(() => repo.close());
  const slice = runVerticalSliceDemo({ repo, workspaceId: "ws_capture", runKey: "before-capture" });
  const expected = repo.countByObjective(slice.objectiveId);
  assert.ok(expected >= 12);
  assert.equal(fs.existsSync(source), false, "fixture records are still only in the running SQL.js handle");

  const captured = await repo.withQuiescedCapture(() => {
    assert.throws(() => runVerticalSliceDemo({
      repo, workspaceId: "ws_capture", runKey: "blocked-during-copy",
    }), /quiesced/);
    fs.copyFileSync(source, copy);
    const restored = openShadowCeoRepository({ dbPath: copy });
    try {
      assert.equal(restored.countByObjective(slice.objectiveId), expected);
    } finally {
      restored.close();
    }
    return expected;
  });
  assert.equal(captured, expected);
  const later = runVerticalSliceDemo({ repo, workspaceId: "ws_capture", runKey: "after-capture" });
  assert.ok(repo.countByObjective(later.objectiveId) >= 12, "writes resume after verified copy");

  await assert.rejects(repo.withQuiescedCapture(() => { throw new Error("copy refused"); }), /copy refused/);
  const stillLater = runVerticalSliceDemo({ repo, workspaceId: "ws_capture", runKey: "after-failure" });
  assert.ok(repo.countByObjective(stillLater.objectiveId) >= 12, "failed copy also releases fence");
});
