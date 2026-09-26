import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { MissionManager } from "../../mission-runtime/mission-manager.js";
import { DEFAULT_MISSION_RUNTIME_CONFIGURATION as config } from "../../mission-runtime/configuration.js";
const approvals = { grandKingApproved: true, pillowConfirmed: true, workers: ["fixture-worker"] };
const receipt = (input: unknown) => {
  const p = input as { missionId: string; workers: Array<string | { workerId: string }> };
  return { missionId: p.missionId, workerReceipts: p.workers.map(w => ({ workerId: typeof w === "string" ? w : w.workerId,
    status: "completed", receiptId: "offline-only-proof" })) };
};

test("completion needs a matching explicit receipt for every assigned worker", () => {
  const m = new MissionManager(); let calls = 0;
  m.bindIntegrations({ workerRegistry: { invokeWorker: p => { calls++; return receipt(p); } } });
  const r = m.execute({ ...approvals, workers: ["one", "two"] }, config);
  assert.equal(r.mission?.currentStatus, "Completed"); assert.equal(r.mission.progress, 100); assert.equal(calls, 1);
});
for (const [name, result] of [
  ["generic pass", { decision: "pass" }], ["missing receipt", {}], ["asynchronous receipt", Promise.resolve({ decision: "pass" })],
] as const) test(`${name} never earns completion`, () => {
  const m = new MissionManager(); m.bindIntegrations({ workerRegistry: { invokeWorker: () => result } });
  const r = m.execute(approvals, config); assert.equal(r.decision, "partial"); assert.equal(r.mission?.currentStatus, "Waiting");
});
for (const mutation of ["mission", "worker", "duplicate", "empty", "structural"])
  test(`rejects ${mutation} completion receipt`, () => {
    const m = new MissionManager(); m.bindIntegrations({ workerRegistry: { invokeWorker: p => {
      const r: any = receipt(p);
      if (mutation === "mission") r.missionId = "foreign";
      if (mutation === "worker") r.workerReceipts[0].workerId = "foreign";
      if (mutation === "duplicate") r.workerReceipts.push(r.workerReceipts[0]);
      if (mutation === "empty") r.workerReceipts[0].receiptId = "";
      if (mutation === "structural") r.structuralSignalOnly = true;
      return r;
    } } });
    assert.equal(m.execute(approvals, config).mission?.currentStatus, "Waiting");
  });
test("worker-reported failure and missing worker integration fail truthfully", () => {
  for (const handler of [undefined, () => ({ decision: "fail" })]) {
    const m = new MissionManager(); if (handler) m.bindIntegrations({ workerRegistry: { invokeWorker: handler } });
    const r = m.execute(approvals, config); assert.equal(r.decision, "fail"); assert.equal(r.mission?.currentStatus, "Failed");
    const retry = m.retry({ missionId: r.mission!.missionId, ...approvals }, config);
    assert.equal(retry.decision, "fail"); assert.equal(retry.mission?.currentStatus, "Failed");
  }
});
for (const scope of ["envelope", "worker"] as const)
  for (const signal of [{ structuralSignalOnly: true }, { fabricated: true }, { decision: "fail" },
    { succeeded: false }, { errors: ["execution failed"] }])
    test(`rejects contradictory ${scope} receipt: ${Object.keys(signal)[0]}`, () => {
      const m = new MissionManager();
      m.bindIntegrations({ workerRegistry: { invokeWorker: p => {
        const result = receipt(p);
        Object.assign(scope === "envelope" ? result : result.workerReceipts[0], signal);
        return result;
      } } });
      const result = m.execute(approvals, config);
      assert.notEqual(result.mission?.currentStatus, "Completed");
      assert.notEqual(result.decision, "pass");
    });
test("only one delegate is called when both orchestration and registry are present", () => {
  let por = 0; let registry = 0; const m = new MissionManager();
  m.bindIntegrations({ pillowOrchestrationRuntime: { invokeWorker: p => { por++; return receipt(p); } },
    workerRegistry: { invokeWorker: p => { registry++; return receipt(p); } } });
  assert.equal(m.execute(approvals, config).mission?.currentStatus, "Completed"); assert.equal(por, 1); assert.equal(registry, 0);
});
test("unknown supplied mission ID neither creates a replacement nor dispatches", () => {
  let calls = 0; const m = new MissionManager(); m.bindIntegrations({ workerRegistry: { invokeWorker: p => { calls++; return receipt(p); } } });
  assert.equal(m.execute({ missionId: "does-not-exist", ...approvals }, config).decision, "fail");
  assert.equal(m.getHistory().missions.length, 0); assert.equal(calls, 0);
});
test("unmet prerequisites block side effects and preserve pending state", () => {
  let calls = 0; const m = new MissionManager(); m.bindIntegrations({ workerRegistry: { invokeWorker: p => { calls++; return receipt(p); } } });
  const r = m.execute({ ...approvals, dependencyMissionIds: ["unfinished"], mode: "sequential" }, config);
  assert.equal(r.decision, "fail"); assert.equal(r.mission?.currentStatus, "Created"); assert.equal(calls, 0);
});
test("exceptions leave an unconfirmed outcome instead of a retryable success or failure", () => {
  const m = new MissionManager(); m.bindIntegrations({ workerRegistry: { invokeWorker: () => { throw new Error("private exception details"); } } });
  const r = m.execute(approvals, config); assert.equal(r.mission?.currentStatus, "Waiting"); assert.equal(r.decision, "partial");
  assert.equal(JSON.stringify(r).includes("private exception details"), false);
});
test("a persisted dispatched mission is not executed twice after interruption", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mission-no-replay-")); const file = path.join(dir, "test.missions.sqlite");
  let calls = 0; const integration = { workerRegistry: { invokeWorker: (p: unknown) => { calls++; return receipt(p); } } };
  try {
    const m = new MissionManager(file); m.bindIntegrations(integration);
    const first = m.execute({ ...approvals, completeAfterRun: false }, config); assert.equal(first.mission?.currentStatus, "Running");
    const next = new MissionManager(file); next.bindIntegrations(integration);
    const repeat = next.execute({ missionId: first.mission!.missionId, ...approvals }, config);
    assert.equal(repeat.decision, "fail"); assert.equal(calls, 1); assert.equal(repeat.mission?.currentStatus, "Running");
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
