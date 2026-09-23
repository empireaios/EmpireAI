import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { DatabaseSync } from "node:sqlite";
import Fastify from "fastify";
import { createMissionRuntime, type AuthorityMissionAdapter } from "@empireai/pillow";
import { PillowHost } from "../../orchestration/pillow-host/pillow-host.js";
import { InMemorySessionStore } from "../../auth/session-store.js";
import { createAuthMiddleware } from "../../auth/middleware.js";
import { env } from "../../config/env.js";
import { createMissionExecutionService } from "../../orchestration/pillow-host/mission-execution/service.js";
import { AUTHORITY_WORKER, AUTHORITY_ACTION, requestIdentity } from "../../orchestration/pillow-host/mission-execution/contract.js";
import { registerMissionRuntimeRoutes } from "../../orchestration/pillow-host/routes/mission-runtime-routes.js";
import { getPillowAuthority } from "../../orchestration/pillow-commissioning/pillow-authority.js";

const root = path.resolve(import.meta.dirname, "../../../..");
const scope = { workspaceId: "ws_empire_1" as const, ownerEmail: env.FOUNDER_EMAIL.trim().toLowerCase() };
const build = "a".repeat(40);
const input = { workers: [AUTHORITY_WORKER], highRisk: false, pillowConfirmed: true, grandKingApproved: true, validated: true,
  missionName: "Inspect actual authority state; no certification or commerce credit" };
const missionUrl = "/api/pillow/mission-runtime/execute";
async function assemble(directory: string, buildSha = build, routes = false) {
  // The actual isolated engine and host facade are exercised; full production boot
  // and unrelated paid-model adapters are deliberately not started by this suite.
  const engine = createMissionRuntime({ repositoryRoot: root } as any,
    { persistenceFile: path.join(directory, "brain.db.missions.sqlite"), persistenceScope: scope });
  await engine.initialize();
  const host = new PillowHost();
  host.pillowSession = { missionRuntime: engine, contextBuilder: {} } as any;
  host.lifecycle = "running";
  const service = createMissionExecutionService({ databasePath: path.join(directory, "brain.db"), scope, buildSha, host });
  let app: ReturnType<typeof Fastify> | undefined;
  let headers = {};
  if (routes) {
    app = Fastify(); const sessions = new InMemorySessionStore();
    const session = await sessions.create({ id: "owner", name: "Owner", role: "founder", email: env.FOUNDER_EMAIL, workspaceId: scope.workspaceId });
    headers = { authorization: `Bearer ${session.token}` };
    await registerMissionRuntimeRoutes(app, { authenticate: createAuthMiddleware(sessions), pillowHost: host, missionExecutionService: service });
    await app.ready(); await service.runner.stop();
  }
  return { engine, host, service, app, headers,
    run: async () => { service.runner.resume(); await service.runner.tick(); },
    close: async () => { await service.runner.stop(); await app?.close(); } };
}
function temp() { return fs.mkdtempSync(path.join(os.tmpdir(), "mission-wiring-")); }
function missionStatus(f: Awaited<ReturnType<typeof assemble>>, id: string) { return f.engine.getHistory().missions.find(m => m.missionId === id)?.currentStatus; }

test("actual authenticated mission route commits intent, auto-enqueues, executes canonical read and reconciles once", async () => {
 const dir = temp(); const f = await assemble(dir, build, true);
 try {
  const response = await f.app!.inject({ method: "POST", url: missionUrl, headers: f.headers, payload: input });
  assert.equal(response.statusCode, 202); const report = response.json().report;
  assert.equal(report.mission.currentStatus, "Waiting"); assert.equal(report.authorityExecution.acceptedDurably, true);
  const jobId = report.authorityExecution.jobId;
  assert.equal(f.service.get(jobId)?.status, "queued");
  const intent = f.engine.getHistory().checkpoints.find(c => c.label === "authority.snapshot.v1:dispatch-intent")!;
  assert.equal(requestIdentity(intent.payload.binding as any), requestIdentity(f.service.get(jobId)!));
  await f.run();
  const job = f.service.get(jobId)!;
  assert.equal(job.status, "completed"); assert.equal(job.reconciled, true);
  assert.deepEqual(job.receipt?.output.authority, getPillowAuthority());
  assert.equal(job.receipt?.output.kind, "actual_readonly_authority_inspection");
  assert.equal(missionStatus(f, report.mission.missionId), "Completed");
  assert.equal(f.host.getMissionRuntime().latestReport.mission.currentStatus, "Completed");
  assert.equal(job.receipt?.certificationCredit, false);
  assert.equal(f.engine.getHistory().transitions.filter(t => t.toState === "Completed").length, 1);
  assert.equal(f.host.reconcileMissionAuthorityExecution(jobId), true);
  await f.run(); assert.equal(f.service.get(jobId)!.attempts, 1);
  assert.equal(f.engine.getHistory().transitions.filter(t => t.toState === "Completed").length, 1);
  const replay = await f.app!.inject({ method: "POST", url: "/api/pillow/mission-runtime/authority-executions", headers: f.headers,
    payload: { action: AUTHORITY_ACTION, missionId: job.missionId, dispatchId: job.dispatchId } });
  assert.equal(replay.statusCode, 200);
 } finally { await f.close(); fs.rmSync(dir, { recursive: true, force: true }); }
});

test("outbox write failure is not acknowledged; restart automatically recovers the original durable intent", async () => {
 const dir = temp(); let f = await assemble(dir, build, true);
 try {
  f.service.store.pendingReceipts(); // Initialize native schema before holding its OS write lock.
  const lock = new DatabaseSync(f.service.store.filename); lock.exec("BEGIN IMMEDIATE");
  const response = await f.app!.inject({ method: "POST", url: missionUrl, headers: f.headers, payload: input });
  lock.exec("ROLLBACK"); lock.close();
  assert.equal(response.statusCode, 503); const r = response.json().report;
  assert.equal(r.authorityExecution.acceptedDurably, false); assert.equal(r.mission.currentStatus, "Waiting");
  const original = f.engine.getHistory().checkpoints.find(c => c.label === "authority.snapshot.v1:dispatch-intent")!.payload.binding;
  await f.close(); f = await assemble(dir);
  await f.run(); const history = f.engine.getHistory();
  assert.equal(history.missions[0]?.currentStatus, "Completed");
  assert.equal(history.checkpoints.filter(c => c.label === "authority.snapshot.v1:dispatch-intent").length, 1);
  assert.deepEqual(history.checkpoints.find(c => c.label === "authority.snapshot.v1:dispatch-intent")!.payload.binding, original);
 } finally { await f.close(); fs.rmSync(dir, { recursive: true, force: true }); }
});

test("durable output survives reconciliation commit failure and is credited after restart without rereading", async () => {
 const dir = temp(); let f = await assemble(dir);
 try {
  const report = f.engine.execute(input); const jobId = report.authorityExecution!.jobId!;
  const lock = new DatabaseSync(path.join(dir, "brain.db.missions.sqlite")); lock.exec("BEGIN IMMEDIATE");
  await f.run(); lock.exec("ROLLBACK"); lock.close();
  const saved = f.service.get(jobId)!; assert.equal(saved.status, "completed"); assert.equal(saved.reconciled, false);
  assert.equal(missionStatus(f, saved.missionId), "Waiting"); assert.ok(f.service.diagnostics().lastError);
  await f.close(); f = await assemble(dir, "b".repeat(40)); await f.run();
  assert.equal(missionStatus(f, saved.missionId), "Completed");
  assert.deepEqual(f.service.get(jobId)?.receipt, saved.receipt); assert.equal(f.service.get(jobId)?.attempts, 1);
  assert.equal(f.service.get(jobId)?.reconciled, true);
  assert.equal(f.service.enqueue(saved.missionId, saved.dispatchId).job.buildSha, build);
 } finally { await f.close(); fs.rmSync(dir, { recursive: true, force: true }); }
});

test("unfinished old-build job becomes unknown after upgrade and never receives completion", async () => {
 const dir = temp(); let f = await assemble(dir);
 try {
  const report = f.engine.execute(input); const jobId = report.authorityExecution!.jobId!;
  await f.close(); f = await assemble(dir, "b".repeat(40)); await f.run();
  assert.equal(f.service.get(jobId)?.status, "unknown"); assert.equal(f.service.get(jobId)?.receipt, null);
  assert.equal(f.service.get(jobId)?.lastError, "BUILD_CHANGED_REVIEW_REQUIRED");
  assert.equal(missionStatus(f, report.mission!.missionId), "Waiting");
  await f.run(); assert.equal(f.service.diagnostics().state, "error");
  assert.equal(f.service.diagnostics().recoveryError, "BUILD_CHANGED_REVIEW_REQUIRED");
 } finally { await f.close(); fs.rmSync(dir, { recursive: true, force: true }); }
});

test("paused or cancelled missions cannot be completed from a stored output", async () => {
 for (const control of ["pause", "cancel"] as const) {
  const dir = temp(); const f = await assemble(dir);
  try {
   const r = f.engine.execute(input); const jobId = r.authorityExecution!.jobId!;
   // Hold only reconciliation, then execute the real canonical read.
   const original = f.host.reconcileMissionAuthorityExecution.bind(f.host);
   f.host.reconcileMissionAuthorityExecution = () => false;
   await f.run(); assert.equal(f.service.get(jobId)?.status, "completed");
   f.engine[control]({ missionId: r.mission!.missionId });
   f.host.reconcileMissionAuthorityExecution = original; await f.run();
   assert.equal(f.service.get(jobId)?.reconciled, false);
   assert.equal(missionStatus(f, r.mission!.missionId), control === "pause" ? "Paused" : "Cancelled");
   assert.equal(f.service.get(jobId)?.attempts, 1);
  } finally { await f.close(); fs.rmSync(dir, { recursive: true, force: true }); }
 }
});

test("reserved worker never falls through generic delegates; missing scope or adapter fails closed", async () => {
 const dir = temp(); const f = await assemble(dir);
 try {
  let genericCalls = 0;
  const engine = createMissionRuntime({ repositoryRoot: root } as any, { dependencies: {
   workerRegistry: { invokeWorker: () => { genericCalls++; return { status: "completed" }; } } } }); await engine.initialize();
  const result = engine.execute(input); assert.equal(result.decision, "fail"); assert.equal(result.mission?.currentStatus, "Failed");
  assert.equal(result.authorityExecution?.acceptedDurably, false); assert.equal(genericCalls, 0);
  const forged = f.engine.execute({ ...input, workers: [AUTHORITY_WORKER, "supplier-purchase"] });
  assert.equal(forged.authorityExecution?.acceptedDurably, false);
 } finally { await f.close(); fs.rmSync(dir, { recursive: true, force: true }); }
});

test("returning mission history cannot mutate persisted intent; every mismatched receipt identity fails closed", async () => {
 const dir = temp(); const f = await assemble(dir);
 try {
  const r = f.engine.execute(input); const jobId = r.authorityExecution!.jobId!;
  const history = f.engine.getHistory();
  (history.checkpoints.find(c => c.label === "authority.snapshot.v1:dispatch-intent")!.payload.binding as any).buildSha = "c".repeat(40);
  assert.equal((f.engine.getHistory().checkpoints[0]!.payload.binding as any).buildSha, build);
  f.host.reconcileMissionAuthorityExecution = () => false; await f.run();
  const receipt = f.service.getTrustedReceipt(jobId)!;
  for (const change of [{ dispatchId: "foreign" }, { buildSha: "b".repeat(40) }, { inputHash: "x" },
    { workerId: "supplier" }, { action: "commerce.list" }, { scope: { ...scope, ownerEmail: "foreign@example.test" } }]) {
   const adapter: AuthorityMissionAdapter = { ...f.service.adapter, getReceipt: () => ({ ...receipt, ...change }) as any };
   f.engine.bindIntegrations({ authorityMissionExecutor: adapter });
   assert.equal(f.engine.reconcileAuthorityExecution(jobId), false);
   assert.equal(missionStatus(f, receipt.missionId), "Waiting");
  }
  f.engine.bindIntegrations({ authorityMissionExecutor: f.service.adapter });
  assert.equal(f.engine.reconcileAuthorityExecution(jobId), true);
 } finally { await f.close(); fs.rmSync(dir, { recursive: true, force: true }); }
});

test("diagnostics distinguish disabled executor, bad configuration and configured paused runtime", async () => {
 const dir = temp(); const f = await assemble(dir, build, true);
 const oldEnabled = process.env.MISSION_AUTHORITY_EXECUTOR_ENABLED; const oldBuild = process.env.EMPIREAI_BUILD_SHA; const oldRailway = process.env.RAILWAY_GIT_COMMIT_SHA;
 try {
  const configured = await f.app!.inject({ method: "POST", url: "/api/pillow/mission-runtime/diagnostics", headers: f.headers, payload: {} });
  assert.equal(configured.json().authorityExecution.state, "paused"); assert.equal(configured.json().authorityExecution.certificationCredit, false);
  for (const enabled of [false, true]) {
   process.env.MISSION_AUTHORITY_EXECUTOR_ENABLED = String(enabled); process.env.EMPIREAI_BUILD_SHA = "invalid"; delete process.env.RAILWAY_GIT_COMMIT_SHA;
   const app = Fastify(); const sessions = new InMemorySessionStore();
   const token = (await sessions.create({ id: "owner", name: "Owner", role: "founder", email: env.FOUNDER_EMAIL, workspaceId: scope.workspaceId })).token;
   await registerMissionRuntimeRoutes(app, { authenticate: createAuthMiddleware(sessions), pillowHost: f.host });
   const response = await app.inject({ method: "GET", url: "/api/pillow/mission-runtime", headers: { authorization: `Bearer ${token}` } });
   assert.equal(response.json().authorityExecution.state, enabled ? "configuration_error" : "disabled"); await app.close();
  }
 } finally {
  for (const [key,value] of Object.entries({ MISSION_AUTHORITY_EXECUTOR_ENABLED: oldEnabled, EMPIREAI_BUILD_SHA: oldBuild, RAILWAY_GIT_COMMIT_SHA: oldRailway })) {
   if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
  await f.close(); fs.rmSync(dir, { recursive: true, force: true });
 }
});


test("real process termination at intent/output boundaries recovers without fabricating or redispatching", async () => {
 for (const phase of ["intent", "output"] as const) {
  const dir = temp(); let f: Awaited<ReturnType<typeof assemble>> | undefined;
  const child = spawn(process.execPath, ["--import", "tsx", "src/validation/tests/fixtures/mission-authority-wiring-child.ts", dir, phase],
    { cwd: path.resolve(import.meta.dirname, "../../.."), stdio: ["ignore", "pipe", "pipe"] });
  try {
   let text = ""; let errors = "";
   child.stderr.on("data", chunk => { errors += chunk; });
   await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Child did not reach ${phase}: ${errors}`)), 20000);
    child.once("exit", code => { clearTimeout(timeout); reject(new Error(`Child exited ${code}: ${errors}`)); });
    child.stdout.on("data", chunk => { text += chunk; if (text.includes(`HELD_${phase}`)) { clearTimeout(timeout); resolve(); } });
   });
   const exited = once(child, "exit"); child.kill("SIGKILL"); await exited;
   f = await assemble(dir, phase === "output" ? "b".repeat(40) : build);
   const history = f.engine.getHistory(); assert.equal(history.missions.length, 1);
   assert.notEqual(history.missions[0]!.currentStatus, "Completed");
   const binding = history.checkpoints.find(c => c.label === "authority.snapshot.v1:dispatch-intent")!.payload.binding as any;
   const job = phase === "output" ? f.service.enqueue(binding.missionId, binding.dispatchId).job : null;
   if (job) assert.equal(job.status, "completed");
   await f.run();
   assert.equal(f.engine.getHistory().missions[0]!.currentStatus, "Completed");
   const recovered = f.service.enqueue(binding.missionId, binding.dispatchId).job;
   assert.equal(recovered.reconciled, true); assert.equal(recovered.attempts, 1);
   assert.equal(recovered.receipt?.output.authority.birthStatus, "NOT_BORN");
   if (job) assert.deepEqual(recovered.receipt, job.receipt);
  } finally { child.kill("SIGKILL"); await f?.close(); fs.rmSync(dir, { recursive: true, force: true }); }
 }
});
