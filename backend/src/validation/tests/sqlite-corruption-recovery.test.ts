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
      assert.deepEqual(fs.readdirSync(tmpRoot).filter(name => name.startsWith("production-corrupt.db")), ["production-corrupt.db"]);
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
        assert.deepEqual(fs.readdirSync(tmpRoot).filter(name => name.startsWith(path.basename(target))), [path.basename(target)]);
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
