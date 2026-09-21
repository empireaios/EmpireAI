import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { test } from "node:test";
import { DatabaseSync } from "node:sqlite";
import { createMissionRuntime } from "@empireai/pillow";
import { EmpireDatabase } from "../../brain/sqlite-database.js";
import { PillowHost } from "../../orchestration/pillow-host/pillow-host.js";
import { createMissionExecutionService } from "../../orchestration/pillow-host/mission-execution/service.js";
import { AUTHORITY_WORKER } from "../../orchestration/pillow-host/mission-execution/contract.js";
const require = createRequire(import.meta.url);
const { ACK, FILES, backupState, restoreState } = require("../../../../deployment/offline-state-bundle.cjs");
const buildSha = "a".repeat(40);
const scope = { workspaceId: "ws_empire_1" as const, ownerEmail: "offline-owner@example.invalid" };
const hash = (bytes: string | Buffer) => createHash("sha256").update(bytes).digest("hex");
const root = path.resolve(import.meta.dirname, "../../../..");
async function fixture(completed = true) {
 const directory = fs.mkdtempSync(path.join(os.tmpdir(), "empire-state-backup-"));
 const primary = path.join(directory, "source.db"); const db = new EmpireDatabase(primary);
 db.exec("CREATE TABLE users(id TEXT PRIMARY KEY,email TEXT,role TEXT,workspace_id TEXT); CREATE TABLE offline_probe(id TEXT PRIMARY KEY,payload TEXT)");
 db.prepare("INSERT INTO users VALUES(@id,@email,@role,@workspace)").run({ id: "preserved-owner-id", email: scope.ownerEmail, role: "founder", workspace: scope.workspaceId });
 db.prepare("INSERT INTO offline_probe VALUES(@id,@payload)").run({ id: "proof", payload: "preserved-business-record-bytes" }); db.close();
 const engine = createMissionRuntime({ repositoryRoot: root } as any, { persistenceFile: primary + ".missions.sqlite", persistenceScope: scope });
 await engine.initialize(); const host = new PillowHost(); host.lifecycle = "running"; host.pillowSession = { missionRuntime: engine, contextBuilder: {} } as any;
 const service = createMissionExecutionService({ databasePath: primary, buildSha, scope, host });
 const report = engine.execute({ workers: [AUTHORITY_WORKER], pillowConfirmed: true, grandKingApproved: true, highRisk: false });
 if (completed) { service.runner.resume(); await service.runner.tick(); }
 await service.runner.stop(); host.lifecycle = "stopped";
 const receipt = service.getTrustedReceipt(report.authorityExecution!.jobId!);
 const options = { databasePath: primary, buildSha, scope, acknowledgement: ACK,
  quiescenceEvidenceSha256: hash(JSON.stringify({ primaryClosed: true, executorStopped: true, missionActionsStopped: true })), destination: path.join(directory, "bundle") };
 return { directory, primary, engine, service, report, receipt, options, cleanup: () => fs.rmSync(directory, { recursive: true, force: true }) };
}
function restoreOptions(f: Awaited<ReturnType<typeof fixture>>, result: any, overrides = {}) {
 return { bundle: f.options.destination, destination: path.join(f.directory, "restore"), buildSha, scope,
  acknowledgement: ACK, manifestSha256: result.manifestSha256, ...overrides };
}
function sourceHashes(f: Awaited<ReturnType<typeof fixture>>) { return FILES.map((file: any) => hash(fs.readFileSync(f.primary + file.suffix))); }
async function reopen(databasePath: string) {
 const engine = createMissionRuntime({ repositoryRoot: root } as any, { persistenceFile: databasePath + ".missions.sqlite", persistenceScope: scope }); await engine.initialize();
 const host = new PillowHost(); host.lifecycle = "running"; host.pillowSession = { missionRuntime: engine, contextBuilder: {} } as any;
 const service = createMissionExecutionService({ databasePath, buildSha, scope, host });
 service.runner.resume(); await service.runner.tick(); await service.runner.stop(); return { engine, service };
}

test("quiesced real primary/native stores restore and reopen with identical completed receipt, history and business data", async () => {
 const f = await fixture(); try {
  const before = sourceHashes(f); const result = backupState(f.options);
  assert.deepEqual(sourceHashes(f), before); assert.equal(result.scopeOfProof.productionSnapshot, false);
  const restored = restoreState(restoreOptions(f, result)); assert.equal(restored.applicationReopenVerified, false);
  const db = new EmpireDatabase(restored.databasePath);
  assert.equal(db.prepare("SELECT payload FROM offline_probe WHERE id=@id").get({ id: "proof" })!.payload, "preserved-business-record-bytes");
  assert.equal(db.prepare("SELECT id FROM users WHERE email=@email").get({ email: scope.ownerEmail })!.id, "preserved-owner-id"); db.close();
  const { engine, service } = await reopen(restored.databasePath);
  assert.deepEqual(engine.getHistory(), f.engine.getHistory());
  assert.deepEqual(service.getTrustedReceipt(f.report.authorityExecution!.jobId!), f.receipt);
  assert.equal(service.get(f.report.authorityExecution!.jobId!)?.attempts, 1);
  assert.equal(engine.getHistory().transitions.filter(t => t.toState === "Completed").length, 1);
  const manifest = JSON.parse(fs.readFileSync(path.join(f.options.destination, "manifest.json"), "utf8"));
  assert.equal(manifest.prerequisite.allWriterShutdownVerifiedByTool, false);
  assert.equal(manifest.buildIdentityEvidence, "DECLARED_SOURCE_BUILD_NOT_OBSERVED_RUNTIME");
  for (const file of manifest.files) assert.equal(fs.statSync(path.join(f.options.destination, file.filename)).mode & 0o777, 0o600);
 } finally { f.cleanup(); }
});

test("restored queued readonly mission continues its original dispatch and completes once", async () => {
 const f = await fixture(false); try {
  const result = backupState(f.options); const restored = restoreState(restoreOptions(f, result));
  const { engine, service } = await reopen(restored.databasePath);
  assert.equal(engine.getHistory().missions[0]!.currentStatus, "Completed");
  assert.equal(service.get(f.report.authorityExecution!.jobId!)?.attempts, 1);
  assert.equal(service.getTrustedReceipt(f.report.authorityExecution!.jobId!)?.output.authority.commerceStatus, "LOCKED");
  assert.equal(engine.getHistory().checkpoints.filter(c => c.label === "authority.snapshot.v1:dispatch-intent").length, 1);
 } finally { f.cleanup(); }
});

test("missing quiescence/build/evidence or wrong primary/native scope is refused before publication", async () => {
 const f = await fixture(); try {
  for (const change of [{ acknowledgement: undefined }, { buildSha: "main" }, { quiescenceEvidenceSha256: "" }, { scope: { ...scope, ownerEmail: "other@example.invalid" } }]) {
   assert.throws(() => backupState({ ...f.options, ...change })); assert.equal(fs.existsSync(f.options.destination), false);
  }
  const native = new DatabaseSync(f.primary + ".mission-execution.sqlite");
  native.prepare("UPDATE execution_meta SET scope=?").run(JSON.stringify({ ...scope, ownerEmail: "other@example.invalid" })); native.close();
  assert.throws(() => backupState(f.options), /scope mismatch/); assert.equal(fs.existsSync(f.options.destination), false);
 } finally { f.cleanup(); }
});

test("active readers/writers and WAL/SHM/journal sidecars are refused without copying a live database", async () => {
 const f = await fixture(); try {
  const before = sourceHashes(f); const held = new DatabaseSync(f.primary + ".missions.sqlite");
  held.exec("BEGIN"); held.prepare("SELECT * FROM mission_snapshot").all(); assert.throws(() => backupState(f.options), /locked/);
  held.exec("ROLLBACK"); held.close(); assert.equal(fs.existsSync(f.options.destination), false); assert.deepEqual(sourceHashes(f), before);
  for (const suffix of ["-wal", "-shm", "-journal"]) {
   fs.writeFileSync(f.primary + suffix, "held-sidecar"); assert.throws(() => backupState(f.options), /sidecar/);
   assert.equal(fs.existsSync(f.options.destination), false); fs.unlinkSync(f.primary + suffix);
  }
  const wal = new DatabaseSync(f.primary); wal.exec("PRAGMA journal_mode=WAL"); wal.close();
  const walBytes = fs.readFileSync(f.primary); assert.throws(() => backupState(f.options), /WAL/); assert.deepEqual(fs.readFileSync(f.primary), walBytes);
 } finally { f.cleanup(); }
});

test("manifest/build/scope/required set and exact bytes are checked before restore", async () => {
 const f = await fixture(); try {
  const result = backupState(f.options);
  assert.throws(() => restoreState(restoreOptions(f, result, { destination: path.join(f.options.destination, "nested-restore") })), /outside the backup bundle/);
  for (const change of [{ manifestSha256: "0".repeat(64) }, { buildSha: "b".repeat(40) }, { scope: { ...scope, ownerEmail: "other@example.invalid" } }]) {
   assert.throws(() => restoreState(restoreOptions(f, result, change))); assert.equal(fs.existsSync(path.join(f.directory, "restore")), false);
  }
  const filename = path.join(f.options.destination, FILES[2].filename); const bytes = fs.readFileSync(filename);
  fs.writeFileSync(filename, Buffer.concat([bytes, Buffer.from("tamper")])); assert.throws(() => restoreState(restoreOptions(f, result)), /digest mismatch/); fs.writeFileSync(filename, bytes);
  fs.renameSync(filename, filename + ".missing"); assert.throws(() => restoreState(restoreOptions(f, result)), /unexpected or missing/); fs.renameSync(filename + ".missing", filename);
  const manifestPath = path.join(f.options.destination, "manifest.json"); const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  manifest.files[0].filename = "../escape.db"; const modified = JSON.stringify(manifest); fs.writeFileSync(manifestPath, modified);
  assert.throws(() => restoreState(restoreOptions(f, result, { manifestSha256: hash(modified) })), /unexpected or missing|entry invalid/);
  assert.equal(fs.existsSync(path.join(f.directory, "escape.db")), false);
 } finally { f.cleanup(); }
});

test("existing targets, symlink files and linked source identities are never overwritten", async () => {
 const f = await fixture(); try {
  const target = f.options.destination; fs.mkdirSync(target); fs.writeFileSync(path.join(target, "keep"), "original");
  assert.throws(() => backupState(f.options), /EEXIST/); assert.equal(fs.readFileSync(path.join(target, "keep"), "utf8"), "original"); fs.rmSync(target, { recursive: true });
  const saved = f.primary + ".saved"; fs.renameSync(f.primary, saved); fs.symlinkSync(saved, f.primary);
  assert.throws(() => backupState(f.options), /symlink/); fs.unlinkSync(f.primary); fs.renameSync(saved, f.primary);
  fs.linkSync(f.primary, saved); assert.throws(() => backupState(f.options), /linked/); fs.unlinkSync(saved);
  const result = backupState(f.options); const restore = path.join(f.directory, "restore"); fs.mkdirSync(restore); fs.writeFileSync(path.join(restore, "keep"), "original");
  assert.throws(() => restoreState(restoreOptions(f, result)), /EEXIST/); assert.equal(fs.readFileSync(path.join(restore, "keep"), "utf8"), "original");
 } finally { f.cleanup(); }
});

test("SQL.js-style atomic source replacement is detected and never publishes an apparently complete bundle", async t => {
 const f = await fixture(); try {
  const original = fs.fsyncSync; let replaced = false;
  t.mock.method(fs, "fsyncSync", (fd: number) => {
   original(fd);
   if (!replaced && fs.readlinkSync(`/proc/self/fd/${fd}`).includes(".bundle.partial-")) {
    replaced = true; const temporary = f.primary + ".replacement"; fs.writeFileSync(temporary, fs.readFileSync(f.primary)); fs.renameSync(temporary, f.primary);
   }
  });
  assert.throws(() => backupState(f.options), /Source changed|Writer activity|Source.*replaced/);
  assert.equal(replaced, true); assert.equal(fs.existsSync(f.options.destination), false);
  assert.equal(fs.readdirSync(f.directory).some(name => name.includes(".partial-")), false);
 } finally { t.mock.restoreAll(); f.cleanup(); }
});

test("failed staged writes preserve source history and leave no published backup or restore", async t => {
 const f = await fixture(); try {
  const before = sourceHashes(f); const original = fs.fsyncSync;
  t.mock.method(fs, "fsyncSync", (fd: number) => { if (fs.readlinkSync(`/proc/self/fd/${fd}`).includes(".bundle.partial-")) throw new Error("injected ENOSPC"); return original(fd); });
  assert.throws(() => backupState(f.options), /ENOSPC/); assert.deepEqual(sourceHashes(f), before); assert.equal(fs.existsSync(f.options.destination), false); t.mock.restoreAll();
  const result = backupState(f.options);
  t.mock.method(fs, "fsyncSync", (fd: number) => { if (fs.readlinkSync(`/proc/self/fd/${fd}`).includes(".restore.partial-")) throw new Error("injected restore fsync failure"); return original(fd); });
  assert.throws(() => restoreState(restoreOptions(f, result)), /restore fsync failure/); assert.equal(fs.existsSync(path.join(f.directory, "restore")), false);
 } finally { t.mock.restoreAll(); f.cleanup(); }
});

test("legacy migration lineage is included only when native history binds its original bytes", async () => {
 const f = await fixture(); try {
  const native = new DatabaseSync(f.primary + ".missions.sqlite");
  const envelope = JSON.parse(native.prepare("SELECT envelope FROM mission_snapshot").get()!.envelope as string);
  const legacy = JSON.stringify({ ...envelope, version: 2 }); const legacyPath = f.primary + ".missions.json";
  fs.writeFileSync(legacyPath, legacy, { mode: 0o600 }); native.prepare("UPDATE mission_snapshot SET legacy_sha256=?").run(hash(legacy)); native.close();
  const result = backupState(f.options); const restored = restoreState(restoreOptions(f, result));
  assert.equal(fs.readFileSync(restored.databasePath + ".missions.json", "utf8"), legacy);
  const { engine } = await reopen(restored.databasePath); assert.equal(engine.getHistory().missions[0]!.currentStatus, "Completed");
  fs.unlinkSync(legacyPath); assert.throws(() => backupState({ ...f.options, destination: path.join(f.directory, "missing-lineage") }));
 } finally { f.cleanup(); }
});


test("unexpected staged files or changed restore proof are rejected before publication", async t => {
 const f = await fixture(); try {
  const original = fs.fsyncSync; let injected = false;
  t.mock.method(fs, "fsyncSync", (fd: number) => {
   original(fd); const filename = fs.readlinkSync(`/proc/self/fd/${fd}`);
   if (!injected && filename.endsWith("manifest.json")) { injected = true; fs.writeFileSync(path.join(path.dirname(filename), "unexpected.txt"), "retain unknown stage content"); }
  });
  assert.throws(() => backupState(f.options), /Unexpected or missing staged files/);
  assert.equal(fs.existsSync(f.options.destination), false); assert.equal(injected, true); t.mock.restoreAll();
  const result = backupState(f.options); injected = false;
  t.mock.method(fs, "fsyncSync", (fd: number) => {
   original(fd); const filename = fs.readlinkSync(`/proc/self/fd/${fd}`);
   if (!injected && filename.endsWith("restore-receipt.json")) {
    injected = true; const receipt = JSON.parse(fs.readFileSync(filename, "utf8"));
    receipt.productionCutover = true; receipt.applicationReopenVerified = true; fs.writeFileSync(filename, JSON.stringify(receipt));
   }
  });
  assert.throws(() => restoreState(restoreOptions(f, result)), /Staged proof bytes changed/);
  assert.equal(injected, true); assert.equal(fs.existsSync(path.join(f.directory, "restore")), false);
 } finally { t.mock.restoreAll(); f.cleanup(); }
});
