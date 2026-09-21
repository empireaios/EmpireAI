import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Fastify from "fastify";
import { DatabaseSync } from "node:sqlite";
import { InMemorySessionStore } from "../../auth/session-store.js";
import { createAuthMiddleware } from "../../auth/middleware.js";
import { env } from "../../config/env.js";
import type { SessionUser } from "../../auth/permissions.js";
import type { PillowHost } from "../../orchestration/pillow-host/pillow-host.js";
import { registerMissionRuntimeRoutes } from "../../orchestration/pillow-host/routes/mission-runtime-routes.js";
import { AUTHORITY_ACTION, AUTHORITY_WORKER } from "../../orchestration/pillow-host/mission-execution/contract.js";
import { createMissionExecutionService } from "../../orchestration/pillow-host/mission-execution/service.js";

const founder: SessionUser = { id: "owner", name: "Owner", role: "founder", email: env.FOUNDER_EMAIL, workspaceId: "ws_empire_1" };
const payload = { action: AUTHORITY_ACTION, missionId: "real-recorded-mission", dispatchId: "real-recorded-dispatch" };
const url = "/api/pillow/mission-runtime/authority-executions";
async function setup() {
 const directory = fs.mkdtempSync(path.join(os.tmpdir(), "mission-route-")); const app = Fastify(); const sessions = new InMemorySessionStore();
 const mission = { missionId: payload.missionId, currentStatus: "Waiting", workers: [AUTHORITY_WORKER] as string[], highRisk: false };
 const timeline = [{ entryId: payload.dispatchId, label: `dispatch:${payload.missionId}`, state: "Running" }];
 let reconciles = 0;
 const host = { getStatus: () => ({ lifecycle: "running" }), getMissionRuntimeHistory: () => ({ missions: [mission], timeline }) };
 const service = createMissionExecutionService({ databasePath: path.join(directory, "brain.db"),
  scope: { workspaceId: "ws_empire_1", ownerEmail: env.FOUNDER_EMAIL.trim().toLowerCase() }, buildSha: "a".repeat(40), host,
  reconcile: receipt => { assert.equal(receipt.missionId, payload.missionId); mission.currentStatus = "Completed"; reconciles++; return true; } });
 await registerMissionRuntimeRoutes(app, { authenticate: createAuthMiddleware(sessions), pillowHost: host as PillowHost, missionExecutionService: service });
 await app.ready(); await service.runner.stop(); // Stop automatic timer; exercise exact real tick deterministically below.
 const token = (await sessions.create(founder)).token; const headers = { authorization: `Bearer ${token}` };
 return { app, sessions, service, mission, timeline, directory, headers, reconciles: () => reconciles,
  close: async () => { await app.close(); fs.rmSync(directory, { recursive: true, force: true }); } };
}
test("authenticated actual route durably enqueues, worker reads canonical authority and exposes only the actual output", async () => {
 const f = await setup(); try {
  const response = await f.app.inject({ method: "POST", url, headers: f.headers, payload });
  assert.equal(response.statusCode, 202); const result = response.json(); assert.equal(result.acceptedDurably, true); assert.equal(result.status, "queued");
  assert.equal(f.service.get(result.jobId)?.receipt, null);
  f.service.runner.resume(); await f.service.runner.tick();
  const read = await f.app.inject({ method: "GET", url: `${url}/${result.jobId}`, headers: f.headers }); assert.equal(read.statusCode, 200);
  const actual = read.json(); assert.equal(actual.status, "completed"); assert.equal(actual.missionReconciled, true);
  assert.equal(actual.output.kind, "actual_readonly_authority_inspection"); assert.equal(actual.output.authority.birthStatus, "NOT_BORN");
  assert.equal(actual.output.authority.commerceStatus, "LOCKED"); assert.equal(actual.certificationCredit, false);
  assert.equal(actual.receipt, undefined); assert.equal(f.reconciles(), 1);
  assert.equal(f.service.getTrustedReceipt(result.jobId)?.outputHash, actual.outputHash);
  const duplicate = await f.app.inject({ method: "POST", url, headers: f.headers, payload }); assert.equal(duplicate.statusCode, 200);
  assert.equal(duplicate.json().jobId, result.jobId); assert.equal(f.mission.currentStatus, "Completed");
 } finally { await f.close(); }
});
test("new execution routes reject unauthenticated or foreign identity before storing jobs", async () => {
 const f = await setup(); try {
  for (const user of [null, { ...founder, email: "foreign@invalid.test" }, { ...founder, role: "operator" as const }, { ...founder, workspaceId: "foreign" }]) {
   const token = user ? (await f.sessions.create(user)).token : null;
   const headers = token ? { authorization: `Bearer ${token}` } : {};
   const create = await f.app.inject({ method: "POST", url, headers, payload }); assert.equal(create.statusCode, user ? 403 : 401);
   const read = await f.app.inject({ method: "GET", url: `${url}/mae_${"a".repeat(64)}`, headers }); assert.equal(read.statusCode, user ? 403 : 401);
  }
  assert.equal(fs.existsSync(f.service.store.filename), true); // onReady performed recovery read, no job acceptance
  const db = new DatabaseSync(f.service.store.filename); assert.equal(db.prepare("SELECT COUNT(*) AS n FROM execution_jobs").get()?.n, 0); db.close();
 } finally { await f.close(); }
});
test("client effects, forged receipts, owner fields and unregistered mission dispatch are rejected", async () => {
 const f = await setup(); try {
  for (const modified of [{ ...payload, action: "commerce.list" }, { ...payload, receipt: { status: "completed" } },
   { ...payload, scope: { workspaceId: "ws_empire_1" } }, { ...payload, buildSha: "b".repeat(40) },
   { ...payload, grandKingApproved: true }, { ...payload, missionId: "../bad" }]) {
   assert.equal((await f.app.inject({ method: "POST", url, headers: f.headers, payload: modified })).statusCode, 400);
  }
  assert.equal((await f.app.inject({ method: "POST", url, headers: f.headers, payload: { ...payload, dispatchId: "unrecorded" } })).statusCode, 409);
  f.mission.workers = ["supplier-purchase"];
  assert.equal((await f.app.inject({ method: "POST", url, headers: f.headers, payload })).statusCode, 409);
  f.mission.workers = [AUTHORITY_WORKER]; f.mission.currentStatus = "Paused";
  assert.equal((await f.app.inject({ method: "POST", url, headers: f.headers, payload })).statusCode, 409);
 } finally { await f.close(); }
});
test("mission pause after admission blocks the real worker at execution time", async () => {
 const f = await setup(); try {
  const response = await f.app.inject({ method: "POST", url, headers: f.headers, payload }); assert.equal(response.statusCode, 202);
  f.mission.currentStatus = "Paused"; f.service.runner.resume(); await f.service.runner.tick();
  const job = f.service.get(response.json().jobId)!; assert.equal(job.status, "unknown"); assert.equal(job.receipt, null); assert.equal(f.reconciles(), 0);
 } finally { await f.close(); }
});
test("storage failure returns unavailable, never 202 accepted", async () => {
 const f = await setup(); try {
  const writer = new DatabaseSync(f.service.store.filename); writer.exec("BEGIN IMMEDIATE");
  const response = await f.app.inject({ method: "POST", url, headers: f.headers, payload });
  writer.exec("ROLLBACK"); writer.close(); assert.equal(response.statusCode, 503); assert.equal(response.json().acceptedDurably, undefined);
 } finally { await f.close(); }
});
