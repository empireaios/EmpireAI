/**
 * SQLite open/quarantine recovery — durable safeguard for malformed sql.js files.
 * Never silently deletes; quarantines then recreates empty disposable state.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { after, describe, test } from "node:test";
import {
  EmpireDatabase,
  getLastSqliteOpenRecovery,
  quarantineSqliteFile,
} from "../../brain/sqlite-database.js";

// Refused opens preserve the corrupt business file and leave only the stable,
// empty ownership database. Do not ignore arbitrary sidecars/quarantine copies.
function assertRefusedOpenInventory(target: string) {
  const name = path.basename(target);
  const sidecar = target + ".sqljs-owner.sqlite";
  assert.deepEqual(fs.readdirSync(path.dirname(target)).filter(entry => entry.startsWith(name)).sort(),
    [name, name + ".sqljs-owner.sqlite"].sort());
  const stat = fs.lstatSync(sidecar);
  assert.equal(stat.isFile(), true);
  assert.equal(stat.nlink, 1);
  const lock = new DatabaseSync(sidecar, { timeout: 0, allowExtension: false });
  try {
    // Constructor refusal must release its ownership transaction.
    lock.exec("BEGIN EXCLUSIVE");
    assert.equal(lock.prepare("PRAGMA integrity_check").get()!.integrity_check, "ok");
    assert.deepEqual(lock.prepare("SELECT name FROM sqlite_master WHERE name NOT LIKE 'sqlite_%'").all(), []);
    lock.exec("ROLLBACK");
  } finally { lock.close(); }
}

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

  test("production refuses a corrupt database without moving or replacing its original bytes", () => {
    const target = path.join(tmpRoot, "production-corrupt.db");
    const original = Buffer.from("definitely-not-sqlite-business-state");
    fs.writeFileSync(target, original);
    const prior = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = "production";
      assert.throws(() => new EmpireDatabase(target), /Production SQLite open refused; original file retained/);
      assert.equal(getLastSqliteOpenRecovery().recovered, false);
      assert.deepEqual(fs.readFileSync(target), original);
      assertRefusedOpenInventory(target);
    } finally {
      if (prior === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = prior;
    }
  });

  test("Railway always refuses corrupt state even with NODE_ENV missing or misconfigured", () => {
    const priorNodeEnv = process.env.NODE_ENV;
    const priorRailwayEnvironment = process.env.RAILWAY_ENVIRONMENT;
    try {
      process.env.RAILWAY_ENVIRONMENT = "production";
      for (const nodeEnv of [undefined, "development"]) {
        if (nodeEnv === undefined) delete process.env.NODE_ENV;
        else process.env.NODE_ENV = nodeEnv;
        const target = path.join(tmpRoot, `railway-corrupt-${nodeEnv ?? "unset"}.db`);
        const original = Buffer.from(`business-data-${nodeEnv ?? "unset"}`);
        fs.writeFileSync(target, original);
        assert.throws(() => new EmpireDatabase(target), /Production SQLite open refused; original file retained/);
        assert.equal(getLastSqliteOpenRecovery().recovered, false);
        assert.deepEqual(fs.readFileSync(target), original);
        assertRefusedOpenInventory(target);
      }
    } finally {
      if (priorNodeEnv === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = priorNodeEnv;
      if (priorRailwayEnvironment === undefined) delete process.env.RAILWAY_ENVIRONMENT;
      else process.env.RAILWAY_ENVIRONMENT = priorRailwayEnvironment;
    }
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
