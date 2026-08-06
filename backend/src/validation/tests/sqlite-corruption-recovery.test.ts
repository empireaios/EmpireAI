/**
 * SQLite open/quarantine recovery — durable safeguard for malformed sql.js files.
 * Never silently deletes; quarantines then recreates empty disposable state.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, describe, test } from "node:test";
import {
  EmpireDatabase,
  getLastSqliteOpenRecovery,
  quarantineSqliteFile,
} from "../../brain/sqlite-database.js";

describe("SQLite corruption quarantine recovery", () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "empire-sqlite-recover-"));

  after(() => {
    try {
      fs.rmSync(tmpRoot, { recursive: true, force: true });
    } catch {
      // best-effort cleanup
    }
  });

  test("quarantineSqliteFile renames without deleting payload", () => {
    const target = path.join(tmpRoot, "sample.db");
    fs.writeFileSync(target, "not-a-db");
    const q = quarantineSqliteFile(target, "unit-test");
    assert.ok(q);
    assert.equal(fs.existsSync(target), false);
    assert.equal(fs.existsSync(q!), true);
    assert.equal(fs.readFileSync(q!, "utf8"), "not-a-db");
  });

  test("EmpireDatabase quarantines malformed file and opens empty DB", () => {
    const target = path.join(tmpRoot, "malformed.db");
    fs.writeFileSync(target, Buffer.from("definitely-not-sqlite-format"));
    const db = new EmpireDatabase(target);
    const recovery = getLastSqliteOpenRecovery();
    assert.equal(recovery.recovered, true);
    assert.ok(recovery.quarantinedPath);
    assert.ok(recovery.reason);
    assert.equal(fs.existsSync(recovery.quarantinedPath!), true);
    db.exec("CREATE TABLE IF NOT EXISTS t (id INTEGER PRIMARY KEY);");
    db.close();
    assert.equal(fs.existsSync(target), true);
  });

  test("EmpireDatabase opens valid empty-created file without quarantine", () => {
    const target = path.join(tmpRoot, "fresh-ok.db");
    const first = new EmpireDatabase(target);
    first.exec("CREATE TABLE IF NOT EXISTS ok (id INTEGER PRIMARY KEY);");
    first.close();
    const second = new EmpireDatabase(target);
    const recovery = getLastSqliteOpenRecovery();
    assert.equal(recovery.recovered, false);
    second.close();
  });
});
