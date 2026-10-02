import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { DatabaseSync } from "node:sqlite";
import { AUTHORITY_ACTION, AUTHORITY_WORKER, EMPTY_INPUT_HASH, ExecutionConflict, type ExecutionRequest } from "../../orchestration/pillow-host/mission-execution/contract.js";
import { MissionExecutionStore } from "../../orchestration/pillow-host/mission-execution/store.js";
import { MissionExecutionRunner, inspectActualAuthority } from "../../orchestration/pillow-host/mission-execution/runner.js";
const scope = { workspaceId: "ws_empire_1" as const, ownerEmail: "owner@invalid.test" };
const build = "a".repeat(40);
function setup() { const directory = fs.mkdtempSync(path.join(os.tmpdir(), "mission-execution-"));
 const file = path.join(directory, "db.mission-execution.sqlite"); return { directory, file, store: new MissionExecutionStore(file, scope) }; }
function input(missionId = "mission-one"): ExecutionRequest { return { missionId, dispatchId: `${missionId}-dispatch`, scope,
 buildSha: build, action: AUTHORITY_ACTION, workerId: AUTHORITY_WORKER, inputHash: EMPTY_INPUT_HASH }; }
const cleanup = (directory: string) => fs.rmSync(directory, { recursive: true, force: true });
test("durable admission deduplicates exact content and rejects changed dispatch/build", () => {
 const { directory, file, store } = setup(); try {
  const first = store.enqueue(input()); assert.equal(first.created, true); assert.equal(first.job.status, "queued");
  assert.deepEqual(new MissionExecutionStore(file, scope).enqueue(input()), { job: first.job, created: false });
  for (const changed of [{ ...input(), dispatchId: "other" }, { ...input(), buildSha: "b".repeat(40) }]) assert.throws(() => store.enqueue(changed), ExecutionConflict);
  assert.deepEqual(store.get(first.job.jobId), first.job);
 } finally { cleanup(directory); }
});
test("competing claims fence stale readers after lease expiry and commit one durable actual output", () => {
 const { directory, file, store } = setup(); try {
  const admitted = store.enqueue(input(), 1000).job; const old = store.claim(build, 1000, 100)!;
  const peer = new MissionExecutionStore(file, scope); assert.equal(peer.claim(build, 1050, 100), null);
  const active = peer.claim(build, 1101, 100)!; assert.equal(active.attempts, 2);
  assert.throws(() => store.complete(old, inspectActualAuthority(), 1102), ExecutionConflict);
  const receipt = peer.complete(active, inspectActualAuthority(), 1102);
  const reloaded = new MissionExecutionStore(file, scope).get(admitted.jobId)!;
  assert.equal(reloaded.status, "completed"); assert.deepEqual(reloaded.receipt, receipt);
  assert.equal(receipt.output.authority.birthStatus, "NOT_BORN"); assert.equal(receipt.certificationCredit, false);
  assert.equal(store.claim(build, 1200), null);
 } finally { cleanup(directory); }
});
test("completed prior-build receipt survives upgrade; unfinished changed-build job becomes unknown", () => {
 const { directory, file, store } = setup(); try {
  const done = store.enqueue(input()).job; store.complete(store.claim(build)!, inspectActualAuthority());
  const unfinished = store.enqueue(input("mission-two")).job; const upgraded = new MissionExecutionStore(file, scope);
  assert.equal(upgraded.claim("b".repeat(40)), null); assert.equal(upgraded.get(done.jobId)?.receipt?.buildSha, build);
  assert.equal(upgraded.get(unfinished.jobId)?.status, "unknown");
  assert.equal(upgraded.get(unfinished.jobId)?.lastError, "BUILD_CHANGED_REVIEW_REQUIRED");
 } finally { cleanup(directory); }
});
test("interrupted read attempts are bounded", () => {
 const { directory, store } = setup(); try {
  const admitted = store.enqueue(input(), 1000).job;
  for (const now of [1000, 1101, 1202]) assert.ok(store.claim(build, now, 100));
  assert.equal(store.claim(build, 1303, 100), null); assert.equal(store.get(admitted.jobId)?.attempts, 3);
  assert.equal(store.get(admitted.jobId)?.status, "unknown");
 } finally { cleanup(directory); }
});
test("actual worker persists output before mission reconciliation and retries reconciliation only", async () => {
 const { directory, file, store } = setup(); try {
  const admitted = store.enqueue(input()).job; let reads = 0;
  const failing = new MissionExecutionRunner(store, build, { canExecute: () => true, reconcile: () => { throw new Error("mission persistence unavailable"); } },
   () => { reads++; return inspectActualAuthority(); });
  failing.resume(); await failing.tick(); await failing.stop(); assert.equal(reads, 1);
  assert.equal(store.get(admitted.jobId)?.status, "completed"); assert.equal(store.get(admitted.jobId)?.reconciled, false);
  const fresh = new MissionExecutionRunner(new MissionExecutionStore(file, scope), build, { canExecute: () => true, reconcile: receipt => {
   assert.equal(receipt.output.authority.commerceStatus, "LOCKED"); return true; } }, () => { throw new Error("must not rerun after receipt"); });
  fresh.resume(); await fresh.tick(); await fresh.stop(); assert.equal(store.get(admitted.jobId)?.reconciled, true);
 } finally { cleanup(directory); }
});
test("inspection exception remains unknown with no leaked exception text", async () => {
 const { directory, store } = setup(); try {
  const admitted = store.enqueue(input()).job; const runner = new MissionExecutionRunner(store, build, { canExecute: () => true }, () => { throw new Error("sensitive-provider-text"); });
  runner.resume(); await runner.tick(); await runner.stop(); assert.equal(store.get(admitted.jobId)?.status, "unknown");
  assert.equal(store.get(admitted.jobId)?.receipt, null); assert.ok(!JSON.stringify(store.get(admitted.jobId)).includes("sensitive-provider-text"));
 } finally { cleanup(directory); }
});
test("pause and unavailable host prevent dispatch; stop waits for active readonly result", async () => {
 const { directory, store } = setup(); try {
  const admitted = store.enqueue(input()).job; let reads = 0; let finish!: (v: ReturnType<typeof inspectActualAuthority>) => void; let hostReady = false;
  const runner = new MissionExecutionRunner(store, build, { canExecute: () => true, canPoll: () => hostReady }, () => {
   reads++; return new Promise(resolve => { finish = resolve; }); });
  runner.resume(); await runner.tick(); assert.equal(store.get(admitted.jobId)?.attempts, 0);
  hostReady = true; runner.pause(); await runner.tick(); assert.equal(reads, 0);
  runner.resume(); const work = runner.tick(); assert.equal(reads, 1); let stopped = false;
  const stop = runner.stop().then(() => { stopped = true; }); await Promise.resolve(); assert.equal(stopped, false);
  finish(inspectActualAuthority()); await work; await stop; assert.equal(store.get(admitted.jobId)?.status, "completed");
  assert.equal(runner.status().paused, true);
 } finally { cleanup(directory); }
});
test("scope mismatch, corrupt output hash and unexpected schema fail closed", () => {
 const { directory, file, store } = setup(); try {
  const admitted = store.enqueue(input()).job; store.complete(store.claim(build)!, inspectActualAuthority());
  assert.throws(() => new MissionExecutionStore(file, { ...scope, ownerEmail: "foreign@invalid.test" }).get(admitted.jobId));
  const db = new DatabaseSync(file); const row = db.prepare("SELECT document FROM execution_jobs WHERE job_id=?").get(admitted.jobId)!;
  const bad = JSON.parse(row.document as string); bad.receipt.output.authority.waveCredit = 1;
  db.prepare("UPDATE execution_jobs SET document=? WHERE job_id=?").run(JSON.stringify(bad), admitted.jobId); db.close();
  const bytes = fs.readFileSync(file); assert.throws(() => store.get(admitted.jobId)); assert.deepEqual(fs.readFileSync(file), bytes);
  const foreign = new DatabaseSync(file); foreign.exec("CREATE TABLE unexpected(id INTEGER)"); foreign.close(); assert.throws(() => store.get(admitted.jobId));
 } finally { cleanup(directory); }
});
test("failed receipt commit cannot acknowledge completion", () => {
 const { directory, file, store } = setup(); try {
  const admitted = store.enqueue(input()).job; const claim = store.claim(build)!;
  const writer = new DatabaseSync(file); writer.exec("BEGIN IMMEDIATE"); assert.throws(() => store.complete(claim, inspectActualAuthority()));
  writer.exec("ROLLBACK"); writer.close(); assert.equal(store.get(admitted.jobId)?.status, "leased"); assert.equal(store.get(admitted.jobId)?.receipt, null);
 } finally { cleanup(directory); }
});
async function child(file: string, mode: string) {
 const proc = spawn(process.execPath, ["--import", "tsx", "src/validation/tests/fixtures/mission-execution-child.ts", file, mode], { cwd: process.cwd(), stdio: ["ignore", "pipe", "pipe"] });
 let errors = ""; proc.stderr?.on("data", d => { errors += String(d); });
 const exited = new Promise<void>((resolve,reject) => proc.once("exit", (code, signal) => code === 0 || signal === "SIGKILL" ? resolve() : reject(new Error(errors))));
 const first = await new Promise<string>((resolve,reject) => { proc.stdout?.once("data", d => resolve(String(d).trim())); proc.once("error", reject);
  proc.once("exit", () => reject(new Error(`child exited before receipt: ${errors}`))); }); return { proc, first, exited };
}
test("killed claimed worker recovers after lease without orphan lock", async () => {
 const { directory, file, store } = setup(); try {
  const admitted = store.enqueue(input()).job; const started = await child(file, "claim"); assert.equal(started.first, "claimed");
  started.proc.kill("SIGKILL"); await started.exited; const recovered = new MissionExecutionStore(file, scope);
  const claim = recovered.claim(build, Date.now() + 5001)!; assert.equal(claim.attempts, 2);
  recovered.complete(claim, inspectActualAuthority(), Date.now() + 5002); assert.equal(recovered.get(admitted.jobId)?.status, "completed");
  assert.equal(fs.existsSync(`${file}.lock`), false);
 } finally { cleanup(directory); }
});
test("kill during SQLite transaction rolls back and next writer preserves queued job", async () => {
 const { directory, file, store } = setup(); try {
  const admitted = store.enqueue(input()).job; const started = await child(file, "transaction"); assert.equal(started.first, "transaction-open");
  started.proc.kill("SIGKILL"); await started.exited;
  assert.equal(new MissionExecutionStore(file, scope).get(admitted.jobId)?.status, "queued"); assert.ok(store.claim(build));
 } finally { cleanup(directory); }
});

test("two separate worker processes cannot both claim one job", async () => {
 const { directory, file, store } = setup(); try {
  const admitted = store.enqueue(input()).job;
  const workers = await Promise.all([child(file, "claim-once"), child(file, "claim-once")]);
  await Promise.all(workers.map(w => w.exited));
  assert.equal(workers.filter(w => w.first === "claimed").length, 1);
  assert.ok(workers.every(w => ["claimed", "empty", "busy"].includes(w.first)));
  assert.equal(store.get(admitted.jobId)?.attempts, 1);
 } finally { cleanup(directory); }
});
test("kill after actual read before commit is unconfirmed and only safe readonly action can retry", async () => {
 const { directory, file, store } = setup(); try {
  const admitted = store.enqueue(input()).job; const started = await child(file, "read-before-commit");
  assert.equal(started.first, "read-not-committed"); started.proc.kill("SIGKILL"); await started.exited;
  assert.equal(store.get(admitted.jobId)?.receipt, null); assert.equal(store.get(admitted.jobId)?.status, "leased");
  const claim = store.claim(build, Date.now() + 5001)!; store.complete(claim, inspectActualAuthority(), Date.now() + 5002);
  assert.equal(store.get(admitted.jobId)?.attempts, 2); assert.equal(store.get(admitted.jobId)?.status, "completed");
 } finally { cleanup(directory); }
});
test("kill after receipt commit preserves output and never executes again", async () => {
 const { directory, file, store } = setup(); try {
  const admitted = store.enqueue(input()).job; const started = await child(file, "complete-before-exit");
  assert.equal(started.first, "receipt-committed"); started.proc.kill("SIGKILL"); await started.exited;
  const recovered = new MissionExecutionStore(file, scope); const done = recovered.get(admitted.jobId)!;
  assert.equal(done.status, "completed"); assert.equal(done.receipt?.output.authority.birthStatus, "NOT_BORN");
  assert.equal(recovered.claim(build, Date.now() + 6000), null); assert.equal(done.attempts, 1);
 } finally { cleanup(directory); }
});
