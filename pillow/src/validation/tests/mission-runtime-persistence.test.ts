import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fork, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import { test } from "node:test";
import { DatabaseSync } from "node:sqlite";
import { MissionManager } from "../../mission-runtime/mission-manager.js";
import { MissionStore, resetMsrSequenceForTesting } from "../../mission-runtime/mission-store.js";
import { MissionFactory } from "../../mission-runtime/mission-factory.js";
import { canonicalMissionScope, MissionSnapshotFile, resolveMissionPersistenceFile } from "../../mission-runtime/mission-persistence.js";
import { DEFAULT_MISSION_RUNTIME_CONFIGURATION as config } from "../../mission-runtime/configuration.js";

function offlineReceipt(input: unknown) {
  const payload = input as { missionId: string; workers: string[] };
  return { missionId: payload.missionId, workerReceipts: payload.workers.map(workerId => ({
    workerId, status: "completed", receiptId: "offline-persistence-fixture" })) };
}
function fixture() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "mission-persistence-"));
  return { directory, filename: path.join(directory, "test.sqlite.missions.sqlite"),
    dispose: () => fs.rmSync(directory, { recursive: true, force: true }) };
}

function readEnvelope(filename: string): any {
  const db = new DatabaseSync(filename, { readOnly: true });
  try { return JSON.parse(db.prepare("SELECT envelope FROM mission_snapshot WHERE id=1").get()!.envelope as string); }
  finally { db.close(); }
}

function writeEnvelope(filename: string, envelope: unknown): void {
  const db = new DatabaseSync(filename);
  try { db.prepare("UPDATE mission_snapshot SET envelope=? WHERE id=1").run(JSON.stringify(envelope)); }
  finally { db.close(); }
}

async function childReceipt(phase: string, filename: string) {
  const child = fork(new URL("./fixtures/mission-persistence-child.ts", import.meta.url), [phase, filename], {
    execArgv: ["--import", "tsx"], stdio: ["ignore", "ignore", "pipe", "ipc"],
    env: { ...process.env, NODE_ENV: "test" },
  });
  let stderr = "";
  child.stderr!.on("data", chunk => { stderr += String(chunk); });
  const receipt = await new Promise<Record<string, any>>((resolve, reject) => {
    const timeout = setTimeout(() => { child.kill("SIGKILL"); reject(new Error(`Child timed out: ${stderr}`)); }, 10_000);
    child.once("message", value => { clearTimeout(timeout); resolve(value as Record<string, any>); });
    child.once("error", error => { clearTimeout(timeout); reject(error); });
    child.once("exit", code => { clearTimeout(timeout); reject(new Error(`Child exited before receipt: ${code}: ${stderr}`)); });
  });
  return { child, receipt };
}

test("acknowledged mission and complete creation history survive actual SIGKILL and fresh-process reload", async () => {
  const f = fixture();
  let writer: ChildProcess | undefined;
  let reader: ChildProcess | undefined;
  try {
    const first = await childReceipt("create", f.filename); writer = first.child;
    const exited = once(writer, "exit"); writer.kill("SIGKILL"); await exited;
    const second = await childReceipt("read", f.filename); reader = second.child;
    assert.deepEqual(second.receipt.history, first.receipt.history);
    assert.deepEqual(second.receipt.audit, first.receipt.audit);
    assert.equal(second.receipt.record.totalMissions, 1);
    const recovered = second.receipt.history.missions[0];
    assert.equal(recovered.missionId, first.receipt.mission.missionId);
    assert.equal(recovered.currentStatus, "Created");
    assert.equal(recovered.grandKingApproved, false);
    assert.equal(recovered.pillowConfirmed, false);
    assert.equal(recovered.structuralSignalOnly, true);
    assert.equal(recovered.fabricated, false);
    assert.equal(fs.statSync(f.filename).mode & 0o777, 0o600);
  } finally { writer?.kill("SIGKILL"); reader?.kill("SIGKILL"); f.dispose(); }
});

test("lifecycle history and reporting survive reload without re-executing integrations", () => {
  const f = fixture();
  try {
    const first = new MissionManager(f.filename);
    const created = first.createMission({ missionName: "queued structural mission", validated: true }, config);
    assert.ok(created.mission);
    const missionId = created.mission.missionId;
    const queued = first.queue({ missionId, validated: true }, config);
    assert.equal(queued.mission?.currentStatus, "Queued");
    const history = first.getHistory();
    assert.ok(history.transitions.length > 0);
    const recovered = new MissionManager(f.filename);
    let executions = 0;
    recovered.bindIntegrations({ pillowOrchestrationRuntime: { invokeWorker: () => { executions++; return { decision: "pass" }; } } });
    recovered.ensureSeeded(config);
    assert.deepEqual(recovered.getHistory(), history);
    assert.equal(executions, 0);
    assert.equal(recovered.execute({ missionId, highRisk: true, grandKingApproved: false }, config).decision, "fail");
    assert.equal(executions, 0);
  } finally { f.dispose(); }
});

test("native busy failure propagates and does not expose an uncommitted mission as accepted state", () => {
  const f = fixture();
  let blocker: DatabaseSync | undefined;
  try {
    const store = new MissionStore(f.filename);
    blocker = new DatabaseSync(f.filename);
    blocker.exec("BEGIN IMMEDIATE");
    const mission = new MissionFactory().create({ missionName: "must not be acknowledged" });
    assert.throws(() => store.saveMission(mission), /locked/);
    assert.equal(store.getMission(mission.missionId), null);
    assert.deepEqual(store.getHistory().missions, []);
    blocker.exec("ROLLBACK"); blocker.close(); blocker = undefined;
    store.saveMission(mission);
    assert.deepEqual(new MissionStore(f.filename).listMissions(), [mission]);
  } finally { blocker?.close(); f.dispose(); }
});

test("stale concurrent instance cannot overwrite a newer persisted mission", () => {
  const f = fixture();
  try {
    const first = new MissionStore(f.filename);
    const stale = new MissionStore(f.filename);
    const a = new MissionFactory().create({ missionName: "winner" });
    first.saveMission(a);
    const b = new MissionFactory().create({ missionName: "stale writer" });
    assert.throws(() => stale.saveMission(b), /another writer/);
    assert.equal(stale.getMission(b.missionId), null);
    const recovered = new MissionStore(f.filename);
    assert.deepEqual(recovered.listMissions(), [a]);
    assert.equal(fs.existsSync(`${f.filename}.lock`), false);
  } finally { f.dispose(); }
});

test("corrupt, unknown-version and invalid-authority files fail closed and are preserved", () => {
  const f = fixture();
  try {
    for (const raw of ["{truncated", JSON.stringify({ version: 999, state: {} }),
      JSON.stringify({ version: 1, state: { missions: [{ missionId: "wrong", grandKingApproved: "true" }],
        transitions: [], checkpoints: [], retries: [], recoveries: [], timeline: [], reports: [], auditTrail: [] } })]) {
      fs.writeFileSync(f.filename, raw);
      assert.throws(() => new MissionStore(f.filename));
      assert.equal(fs.readFileSync(f.filename, "utf8"), raw);
    }
  } finally { f.dispose(); }
});

test("mission identifiers remain unique after sequence reset at the same timestamp", context => {
  context.mock.method(Date, "now", () => 42);
  resetMsrSequenceForTesting();
  const one = new MissionFactory().create({});
  resetMsrSequenceForTesting();
  const two = new MissionFactory().create({});
  assert.notEqual(one.missionId, two.missionId);
});

test("SQLite commit failure aborts the complete creation state and preserves prior durable content", context => {
  const f = fixture();
  try {
    const manager = new MissionManager(f.filename);
    const accepted = manager.createMission({ missionName: "already accepted" }, config);
    const before = fs.readFileSync(f.filename);
    const execute = DatabaseSync.prototype.exec;
    context.mock.method(DatabaseSync.prototype, "exec", function (this: DatabaseSync, sql: string) {
      if (sql === "COMMIT") throw new Error("fixture SQLite commit I/O failure");
      return execute.call(this, sql);
    });
    assert.throws(() => manager.createMission({ missionName: "must fail" }, config), /SQLite commit I.O failure/);
    context.mock.restoreAll();
    assert.deepEqual(fs.readFileSync(f.filename), before);
    assert.deepEqual(manager.getHistory().missions.map(m => m.missionId), [accepted.mission!.missionId]);
    assert.equal(manager.getHistory().timeline.length, 1);
    assert.equal(fs.existsSync(`${f.filename}.lock`), false);
    assert.equal(fs.readdirSync(f.directory).some(name => name.endsWith(".tmp")), false);
  } finally { f.dispose(); }
});

test("hosted mission storage follows the configured database volume and production rejects RAM-only mode", () => {
  assert.equal(resolveMissionPersistenceFile("/data/canary/test.sqlite", true), "/data/canary/test.sqlite.missions.sqlite");
  assert.throws(() => resolveMissionPersistenceFile(undefined, true), /persistent DATABASE_PATH/);
  assert.throws(() => resolveMissionPersistenceFile(":memory:", true), /persistent DATABASE_PATH/);
  assert.equal(resolveMissionPersistenceFile(":memory:", false), undefined);
});


test("saved approval never authorizes a later execution or allows stored risk to be downgraded", () => {
  const f = fixture();
  try {
    const first = new MissionManager(f.filename);
    const { mission } = first.createMission({ missionName: "previously approved", highRisk: true,
      grandKingApproved: true, pillowConfirmed: true, workers: ["offline-sentinel"] }, config);
    assert.ok(mission);
    const recovered = new MissionManager(f.filename);
    let invocations = 0;
    recovered.bindIntegrations({ workerRegistry: { invokeWorker: input => { invocations++; return offlineReceipt(input); } } });
    for (const request of [
      { missionId: mission.missionId, grandKingApproved: false, pillowConfirmed: false },
      { missionId: mission.missionId, highRisk: false, grandKingApproved: false, pillowConfirmed: false },
      { missionId: mission.missionId },
      { missionId: mission.missionId, grandKingApproved: true, pillowConfirmed: false },
    ]) {
      const result = recovered.execute(request, config);
      assert.equal(result.decision, "fail");
      assert.equal(recovered.getHistory().missions[0].currentStatus, "Created");
      assert.equal(invocations, 0);
    }
    assert.equal(recovered.execute({ missionId: mission.missionId, highRisk: false, pillowConfirmed: true },
      { ...config, requireGrandKingApproval: false }).decision, "fail");
    const permitted = recovered.execute({ missionId: mission.missionId, grandKingApproved: true, pillowConfirmed: true }, config);
    assert.equal(permitted.decision, "pass");
    assert.equal(invocations, 1);
  } finally { f.dispose(); }
});

test("restored paused, failed and interrupted missions require current permission before resume, retry or recovery", () => {
  for (const action of ["resume", "retry", "recover"] as const) {
    const f = fixture();
    try {
      const first = new MissionManager(f.filename);
      first.bindIntegrations({ workerRegistry: { invokeWorker: offlineReceipt } });
      const approvals = { grandKingApproved: true, pillowConfirmed: true, workers: ["offline-persistence-worker"] };
      const { mission } = first.createMission({ missionName: action, highRisk: true, ...approvals }, config);
      const missionId = mission!.missionId;
      first.execute({ missionId, ...approvals, forceFail: action === "retry", completeAfterRun: action === "retry" }, config);
      if (action === "resume") first.pause({ missionId }, config);
      const recovered = new MissionManager(f.filename);
      const before = recovered.getHistory();
      assert.equal(recovered[action]({ missionId, highRisk: false, grandKingApproved: false, pillowConfirmed: false }, config).decision, "fail");
      assert.deepEqual(recovered.getHistory(), before);
    } finally { f.dispose(); }
  }
});

test("all nested history shapes are validated on reload and invalid bytes remain untouched", () => {
  const f = fixture();
  try {
    const manager = new MissionManager(f.filename);
    manager.bindIntegrations({ workerRegistry: { invokeWorker: offlineReceipt } });
    const approvals = { pillowConfirmed: true, grandKingApproved: true, workers: ["offline-persistence-worker"] };
    const { mission } = manager.createMission({ missionName: "full history", ...approvals }, config);
    manager.execute({ missionId: mission!.missionId, ...approvals, checkpointLabel: "checkpoint", completeAfterRun: false }, config);
    manager.produceReport({ missionId: mission!.missionId }, config);
    const valid = readEnvelope(f.filename);
    const changes: Array<(state: any) => void> = [
      state => { state.missions[0].progress = "corrupted-progress"; },
      state => { state.missions[0].retryCount = -1; },
      state => { state.missions[0].grandKingApproved = "true"; },
      state => { state.transitions = [{}]; },
      state => { state.checkpoints = [{}]; },
      state => { state.retries = [{}]; },
      state => { state.recoveries = [{}]; },
      state => { state.timeline = [{}]; },
      state => { state.reports = [{}]; },
      state => { state.reports[0].executionTimeline[0].notes = "not-an-array"; },
      state => { state.reports[0].dependencies = [{ missionId: "x", mode: "parent", satisfied: "true" }]; },
      state => { state.reports[0].checkpoints[0].payload = []; },
      state => { state.reports[0].neverBypassGrandKingApproval = false; },
      state => { state.transitions[0].missionId = "unknown-mission"; },
    ];
    for (const change of changes) {
      const envelope = structuredClone(valid); change(envelope.state);
      const raw = JSON.stringify(envelope); writeEnvelope(f.filename, envelope);
      assert.throws(() => new MissionStore(f.filename), /snapshot|history/i);
      assert.equal(JSON.stringify(readEnvelope(f.filename)), raw);
    }
    writeEnvelope(f.filename, valid);
    const file = new MissionSnapshotFile(f.filename); file.load();
    const invalid = structuredClone(valid.state); invalid.missions[0].progress = Number.NaN;
    assert.throws(() => file.save(invalid), /invalid/);
    assert.deepEqual(readEnvelope(f.filename), valid);
  } finally { f.dispose(); }
});

test("snapshot is bound to the canonical organization and cannot be silently adopted after identity changes", () => {
  const f = fixture();
  try {
    const scope = canonicalMissionScope(" Founder@Example.invalid ");
    assert.deepEqual(scope, { ownerEmail: "founder@example.invalid", workspaceId: "ws_empire_1" });
    const manager = new MissionManager(f.filename, scope);
    manager.createMission({ missionName: "organization-owned history" }, config);
    const raw = JSON.stringify(readEnvelope(f.filename));
    assert.equal(new MissionManager(f.filename, scope).getHistory().missions.length, 1);
    assert.throws(() => new MissionManager(f.filename, canonicalMissionScope("different@example.invalid")), /identity/);
    assert.throws(() => new MissionManager(f.filename), /identity/);
    const foreign = JSON.parse(raw); foreign.scope.workspaceId = "another-workspace";
    writeEnvelope(f.filename, foreign);
    assert.throws(() => new MissionManager(f.filename, scope), /identity/);
    const unbound = JSON.parse(raw); delete unbound.scope;
    writeEnvelope(f.filename, unbound);
    assert.throws(() => new MissionManager(f.filename, scope), /identity/);
    assert.deepEqual(readEnvelope(f.filename), unbound);
  } finally { f.dispose(); }
});
