import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import { EmpireDatabase } from "../../brain/sqlite-database.js";
import { withQuiescedSqliteSave } from "../../brain/quiesced-sqlite-save.js";

const { captureCheckpoint, verifyCheckpoint } = createRequire(import.meta.url)(
  "../../../../deployment/legacy-checkpoint-capture.cjs",
) as {
  captureCheckpoint: (input: { source: string; destination: string; sourceCommit: string }) => { manifestSha256: string };
  verifyCheckpoint: (input: { directory: string; manifestSha256: string }) => { verified: boolean; pendingRam: string; completeLiveState: boolean };
};

test("an unsaved live SQL.js record reaches the verified copy while writes are fenced", async t => {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "quiesced-sqlite-")));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const source = path.join(dir, "brain.db"), destination = path.join(dir, "capture");
  const db = new EmpireDatabase(source);
  db.exec("CREATE TABLE evidence (id INTEGER PRIMARY KEY, value TEXT)");
  db.prepare("INSERT INTO evidence VALUES (1, 'in-memory-before-save')").run();
  assert.equal(fs.existsSync(source), false, "fixture must begin with RAM state not yet on disk");

  const receipt = await withQuiescedSqliteSave(db, () => {
    assert.throws(() => db.prepare("INSERT INTO evidence VALUES (2, 'later')").run(), /quiesced/);
    assert.throws(() => db.exec("DELETE FROM evidence"), /quiesced/);
    assert.throws(() => db.pragma("user_version = 5"), /quiesced/);
    assert.throws(() => db.close(), /quiesced/);
    assert.throws(() => db.holdWritesForCapture(), /fence unavailable/);
    const capture = captureCheckpoint({ source, destination, sourceCommit: "a".repeat(40) });
    const proof = verifyCheckpoint({ directory: destination, manifestSha256: capture.manifestSha256 });
    assert.equal(proof.verified, true);
    assert.equal(proof.completeLiveState, false, "other stores are not in this copy");
    return capture.manifestSha256;
  });
  const copied = new DatabaseSync(path.join(destination, "checkpoint.db"), { readOnly: true });
  assert.equal(copied.prepare("SELECT value FROM evidence WHERE id=1").get()?.value, "in-memory-before-save");
  copied.close();
  db.prepare("INSERT INTO evidence VALUES (2, 'later')").run();
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM evidence").get()?.n, 2);
  assert.equal(receipt.length, 64);
  db.close();
});

test("a failed capture releases the handle fence without producing a successful copy", async t => {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "quiesced-refusal-")));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const db = new EmpireDatabase(path.join(dir, "brain.db"));
  db.exec("CREATE TABLE evidence (value TEXT)");
  await assert.rejects(withQuiescedSqliteSave(db, () => { throw new Error("disk copy refused"); }), /disk copy refused/);
  db.prepare("INSERT INTO evidence VALUES ('resumed')").run();
  assert.equal(db.prepare("SELECT value FROM evidence").get()?.value, "resumed");
  db.close();
});
