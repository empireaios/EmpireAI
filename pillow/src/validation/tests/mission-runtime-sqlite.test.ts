import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { fork, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import { MissionManager } from "../../mission-runtime/mission-manager.js";
import { MissionStore } from "../../mission-runtime/mission-store.js";
import { canonicalMissionScope, migrateLegacyMissionSnapshot, MissionSnapshotFile } from "../../mission-runtime/mission-persistence.js";
import { DEFAULT_MISSION_RUNTIME_CONFIGURATION as config } from "../../mission-runtime/configuration.js";

function fixture() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "mission-native-"));
  const filename = path.join(directory, "recovery.missions.sqlite");
  return { directory, filename, legacy: filename.replace(/\.sqlite$/, ".json"),
    dispose: () => fs.rmSync(directory, { recursive: true, force: true }) };
}
function envelope(filename: string): any {
  const db = new DatabaseSync(filename, { readOnly: true });
  try { return JSON.parse(db.prepare("SELECT envelope FROM mission_snapshot WHERE id=1").get()!.envelope as string); }
  finally { db.close(); }
}
function receipt(child: ChildProcess): Promise<any> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { cleanup(); child.kill("SIGKILL"); reject(new Error("Child receipt timed out")); }, 10_000);
    const onMessage = (value: unknown) => { cleanup(); resolve(value); };
    const onExit = (code: number | null) => { cleanup(); reject(new Error(`Child exited before receipt: ${code}`)); };
    const onError = (error: Error) => { cleanup(); reject(error); };
    const cleanup = () => { clearTimeout(timeout); child.off("message", onMessage); child.off("exit", onExit); child.off("error", onError); };
    child.once("message", onMessage); child.once("exit", onExit); child.once("error", onError);
  });
}
function child(phase: string, filename: string) {
  return fork(new URL("./fixtures/mission-sqlite-child.ts", import.meta.url), [phase, filename], {
    execArgv: ["--import", "tsx"], stdio: ["ignore", "ignore", "inherit", "ipc"], env: { ...process.env, NODE_ENV: "test" },
  });
}

test("SIGKILL during a real SQLite write rolls back, releases OS lock and permits a fresh writer without deleting any lock", async () => {
  const f = fixture(); let killed: ChildProcess | undefined; let recovered: ChildProcess | undefined;
  try {
    const manager = new MissionManager(f.filename);
    manager.createMission({ missionName: "acknowledged before crash" }, config);
    const before = manager.getHistory();
    killed = child("hold-uncommitted", f.filename);
    const held = await receipt(killed);
    assert.equal(held.phase, "uncommitted"); assert.ok(held.journalBytes > 0);
    // A live writer must never be mistaken for stale or be force-unlocked.
    assert.throws(() => new MissionManager(f.filename).createMission({ missionName: "conflicting" }, config), /locked/);
    const exited = once(killed, "exit"); killed.kill("SIGKILL"); await exited;
    assert.equal(fs.existsSync(`${f.filename}.lock`), false);
    recovered = child("recover-and-write", f.filename);
    const result = await receipt(recovered);
    assert.deepEqual(result.recovered, before);
    assert.equal(result.history.missions.length, 2);
    assert.equal(result.accepted.currentStatus, "Created");
    assert.equal(result.accepted.grandKingApproved, false);
    assert.equal(new MissionStore(f.filename).listMissions().length, 2);
    const db = new DatabaseSync(f.filename);
    assert.equal(db.prepare("PRAGMA integrity_check").get()!.integrity_check, "ok"); db.close();
  } finally { killed?.kill("SIGKILL"); recovered?.kill("SIGKILL"); f.dispose(); }
});

test("a stale process cannot replace another process's newly committed history", async () => {
  const f = fixture(); let stale: ChildProcess | undefined;
  try {
    const manager = new MissionManager(f.filename);
    manager.createMission({ missionName: "baseline" }, config);
    stale = child("stale", f.filename); assert.equal((await receipt(stale)).phase, "loaded");
    manager.createMission({ missionName: "new accepted state" }, config);
    const response = receipt(stale); stale.send("write"); const rejected = await response;
    assert.match(rejected.error, /another writer/);
    assert.equal(rejected.history.missions.length, 1);
    assert.deepEqual(new MissionManager(f.filename).getHistory(), manager.getHistory());
  } finally { stale?.kill("SIGKILL"); f.dispose(); }
});

test("legacy JSON needs explicit scope-checked migration and is preserved byte for byte", () => {
  const f = fixture();
  try {
    const scope = canonicalMissionScope("owner@example.invalid");
    const manager = new MissionManager(f.filename, scope);
    manager.createMission({ missionName: "legacy accepted history" }, config);
    const legacyEnvelope = envelope(f.filename); legacyEnvelope.version = 2;
    const legacyBytes = Buffer.from(JSON.stringify(legacyEnvelope, null, 2));
    fs.unlinkSync(f.filename); fs.writeFileSync(f.legacy, legacyBytes);
    assert.throws(() => new MissionStore(f.filename, scope), /explicit migration/);
    assert.equal(fs.existsSync(f.filename), false);
    assert.throws(() => migrateLegacyMissionSnapshot(f.filename, canonicalMissionScope("other@example.invalid")), /identity/);
    assert.equal(fs.existsSync(f.filename), false);
    const migration = migrateLegacyMissionSnapshot(f.filename, scope);
    assert.equal(migration.sha256, createHash("sha256").update(legacyBytes).digest("hex"));
    assert.deepEqual(fs.readFileSync(f.legacy), legacyBytes);
    assert.deepEqual(new MissionManager(f.filename, scope).getHistory(), manager.getHistory());
    const next = new MissionManager(f.filename, scope);
    next.createMission({ missionName: "post migration history" }, config);
    assert.throws(() => migrateLegacyMissionSnapshot(f.filename, scope), /another writer|overwrite/);
    assert.deepEqual(fs.readFileSync(f.legacy), legacyBytes);
    fs.appendFileSync(f.legacy, " ");
    assert.throws(() => new MissionStore(f.filename, scope), /has changed/);
  } finally { f.dispose(); }
});

test("corrupt legacy bytes and a potentially active old writer are retained and never adopted", () => {
  const f = fixture();
  try {
    fs.writeFileSync(f.legacy, "{corrupt original bytes");
    assert.throws(() => migrateLegacyMissionSnapshot(f.filename));
    assert.equal(fs.readFileSync(f.legacy, "utf8"), "{corrupt original bytes");
    assert.equal(fs.existsSync(f.filename), false);
    fs.unlinkSync(f.legacy);
    const manager = new MissionManager(f.filename); manager.createMission({ missionName: "source" }, config);
    const raw = envelope(f.filename); raw.version = 2;
    fs.unlinkSync(f.filename); fs.writeFileSync(f.legacy, JSON.stringify(raw)); fs.writeFileSync(`${f.legacy}.lock`, "held or orphaned old lock");
    assert.throws(() => migrateLegacyMissionSnapshot(f.filename), /Legacy mission writer lock/);
    assert.equal(fs.readFileSync(`${f.legacy}.lock`, "utf8"), "held or orphaned old lock");
    assert.equal(fs.readFileSync(f.legacy, "utf8"), JSON.stringify(raw));
  } finally { f.dispose(); }
});

test("capacity failure preserves all prior state; SQLite ownership and sync settings are explicit", () => {
  const f = fixture();
  try {
    const manager = new MissionManager(f.filename); manager.createMission({ missionName: "kept" }, config);
    const store = new MissionSnapshotFile(f.filename); const saved = store.load()!;
    const oversized = structuredClone(saved); oversized.missions[0]!.missionName = "x".repeat(16 * 1024 * 1024);
    assert.throws(() => store.save(oversized), /capacity/);
    assert.deepEqual(new MissionSnapshotFile(f.filename).load(), saved);
    assert.equal(fs.statSync(f.filename).mode & 0o777, 0o600);
    const db = new DatabaseSync(f.filename);
    assert.equal(db.prepare("PRAGMA journal_mode").get()!.journal_mode, "delete");
    assert.equal(db.prepare("PRAGMA user_version").get()!.user_version, 3);
    assert.equal(db.prepare("PRAGMA application_id").get()!.application_id, 0x454d5352);
    db.close();
  } finally { f.dispose(); }
});

test("unrelated SQLite and symlinked files are rejected without recreating their history", () => {
  const f = fixture();
  try {
    const db = new DatabaseSync(f.filename); db.exec("CREATE TABLE unrelated(value TEXT); INSERT INTO unrelated VALUES('keep me');"); db.close();
    const before = fs.readFileSync(f.filename);
    assert.throws(() => new MissionStore(f.filename), /schema/);
    assert.deepEqual(fs.readFileSync(f.filename), before);
    const other = path.join(f.directory, "other.sqlite"); fs.renameSync(f.filename, other); fs.symlinkSync(other, f.filename);
    assert.throws(() => new MissionStore(f.filename), /regular file/);
    assert.deepEqual(fs.readFileSync(other), before);
  } finally { f.dispose(); }
});


test("missing authoritative row fails closed instead of presenting empty history", () => {
  const f = fixture();
  try {
    const manager = new MissionManager(f.filename); manager.createMission({ missionName: "prior history" }, config);
    const db = new DatabaseSync(f.filename); db.exec("DELETE FROM mission_snapshot"); db.close();
    const before = fs.readFileSync(f.filename);
    assert.throws(() => new MissionStore(f.filename), /authoritative record is missing/);
    assert.deepEqual(fs.readFileSync(f.filename), before);
  } finally { f.dispose(); }
});

test("error after commit is not acknowledged or silently retried over its durable revision", context => {
  const f = fixture();
  try {
    const manager = new MissionManager(f.filename); manager.createMission({ missionName: "acknowledged" }, config);
    context.mock.method(fs, "fsyncSync", () => { throw new Error("fixture directory sync uncertainty"); });
    assert.throws(() => manager.createMission({ missionName: "committed but unacknowledged" }, config), /sync uncertainty/);
    context.mock.restoreAll();
    assert.equal(manager.getHistory().missions.length, 1);
    assert.throws(() => manager.createMission({ missionName: "must reload instead" }, config), /another writer/);
    const recovered = new MissionManager(f.filename);
    assert.equal(recovered.getHistory().missions.length, 2);
    assert.ok(recovered.getHistory().missions.every(mission => mission.currentStatus === "Created" && !mission.grandKingApproved));
  } finally { context.mock.restoreAll(); f.dispose(); }
});
