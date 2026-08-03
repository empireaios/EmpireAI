import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  EXECUTIVE_ACTIONS,
  WAM_CAPABILITIES,
  buildWorkforceAccessManagerConfiguration,
  createWorkforceAccessManager,
  resetWorkforceAccessManagerForTesting,
} from "../../workforce-access-manager/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build() {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createWorkforceAccessManager(bootstrap);
  await engine.initialize();
  engine.connectWorkforceAccessManager();
  return engine;
}

describe("Q0-11 Workforce Access Manager", () => {
  beforeEach(resetWorkforceAccessManagerForTesting);

  test("1 locks mandatory workforce-access-manager boundaries", () => {
    const c = buildWorkforceAccessManagerConfiguration(REPO_ROOT, {
      neverExecuteWorkerLogic: false as never,
      neverReplaceWorkerImplementations: false as never,
      neverPerformOrchestration: false as never,
      neverMakeStrategicDecisions: false as never,
      neverOverrideGrandKing: false as never,
    });
    assert.equal(c.neverExecuteWorkerLogic, true);
    assert.equal(c.neverReplaceWorkerImplementations, true);
    assert.equal(c.neverPerformOrchestration, true);
    assert.equal(c.neverMakeStrategicDecisions, true);
    assert.equal(c.neverOverrideGrandKing, true);
  });

  test("2 initializes PILLOW-WAM-001 for Q0-11", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q0-11");
    assert.equal(state.engineVersion, "PILLOW-WAM-001");
    for (const action of EXECUTIVE_ACTIONS) {
      assert.ok(state.configuration.supportedActions.includes(action));
    }
  });

  test("3 locates a worker for Pillow", async () => {
    const record = (await build()).locateWorker({
      executiveRequest: "Locate engineering specialist for executive access",
      workerId: "wcr-wkr-engineering-01",
      validated: true,
    }).records[0]!;
    assert.equal(record.requestedAction, "locate");
    assert.equal(record.workerId, "wcr-wkr-engineering-01");
    assert.equal(record.accessStatus, "completed");
    assert.equal(record.connectedToPillow, true);
  });

  test("4 invokes a worker without executing worker logic", async () => {
    const record = (await build()).invokeWorker({
      executiveRequest: "Invoke operations coordinator through access manager",
      workerId: "wcr-wkr-operations-01",
      validated: true,
    }).records[0]!;
    assert.equal(record.requestedAction, "invoke");
    assert.equal(record.workerStatus, "invoked");
    assert.equal(record.workerLogicExecuted, false);
  });

  test("5 suspends and resumes a worker", async () => {
    const engine = await build();
    const suspended = engine.suspendWorker({
      executiveRequest: "Suspend product specialist pending review",
      workerId: "wcr-wkr-product-01",
      validated: true,
    }).records[0]!;
    assert.equal(suspended.workerStatus, "suspended");
    const resumed = engine.resumeWorker({
      executiveRequest: "Resume product specialist after clearance",
      workerId: "wcr-wkr-product-01",
      validated: true,
    }).records[0]!;
    assert.equal(resumed.workerStatus, "connected");
    assert.equal(resumed.accessStatus, "completed");
  });

  test("6 reassigns a worker and inspects capabilities", async () => {
    const engine = await build();
    const reassigned = engine.reassignWorker({
      executiveRequest: "Reassign access from strategy to finance analyst",
      workerId: "wcr-wkr-strategy-01",
      reassignToWorkerId: "wcr-wkr-finance-01",
      validated: true,
    }).records[0]!;
    assert.equal(reassigned.requestedAction, "reassign");
    assert.equal(reassigned.workerId, "wcr-wkr-finance-01");
    assert.ok(reassigned.reason.toLowerCase().includes("reassign"));

    const inspected = engine.inspectWorker({
      executiveRequest: "Inspect security specialist status and capabilities",
      workerId: "wcr-wkr-security-01",
      validated: true,
    }).records[0]!;
    assert.ok(inspected.capabilitiesInspected.length >= 1);
    assert.equal(inspected.metadataVersion, "WAM-001-v1");
  });

  test("7 produces machine-readable access records", async () => {
    const record = (await build()).stopWorker({
      executiveRequest: "Stop compliance reviewer execution access",
      workerId: "wcr-wkr-compliance-01",
      reason: "Executive stop requested",
      validated: true,
    }).records[0]!;
    assert.ok(record.accessId.startsWith("wam-acc-"));
    assert.equal(record.workerStatus, "stopped");
    assert.equal(record.neverExecuteWorkerLogic, true);
    assert.equal(record.orchestrationPerformed, false);
  });

  test("8 rejects execute / replace / orchestrate / strategic / Grand King boundary violations", async () => {
    const engine = await build();
    const base = {
      executiveRequest: "Locate engineering specialist for access control",
      workerId: "wcr-wkr-engineering-01",
      validated: true as const,
    };
    assert.equal(engine.locateWorker({ ...base, executeWorkerLogic: true }).validation.decision, "fail");
    assert.equal(engine.locateWorker({ ...base, replaceWorkerImplementations: true }).validation.decision, "fail");
    assert.equal(engine.locateWorker({ ...base, performOrchestration: true }).validation.decision, "fail");
    assert.equal(engine.locateWorker({ ...base, makeStrategicDecisions: true }).validation.decision, "fail");
    assert.equal(engine.locateWorker({ ...base, overrideGrandKing: true }).validation.decision, "fail");
  });

  test("9 supports extensible executive actions and denied unknown workers", async () => {
    const engine = createWorkforceAccessManager(
      await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true }),
      { configuration: { supportedActions: [...EXECUTIVE_ACTIONS, "quarantine"] } },
    );
    await engine.initialize();
    engine.connectWorkforceAccessManager();
    assert.ok(engine.getState().configuration.supportedActions.includes("quarantine"));
    const denied = engine.invokeWorker({
      executiveRequest: "Invoke missing worker for access probe",
      workerId: "does-not-exist",
      validated: true,
    }).records[0]!;
    assert.equal(denied.accessStatus, "denied");
    assert.ok(WAM_CAPABILITIES.includes("extensible_executive_actions"));
  });

  test("10 validates stored access records", async () => {
    const engine = await build();
    engine.locateWorker({
      executiveRequest: "Locate data intelligence operator for inspection",
      workerId: "wcr-wkr-data-01",
      validated: true,
    });
    const validation = engine.validateAccess({ executiveRequest: "", validated: true, requestedAction: "inspect" });
    assert.ok(validation.validation.decision === "pass" || validation.validation.decision === "partial");
    assert.equal(engine.getRecords().length, 1);
    assert.equal(engine.getLatestRecord()?.neverOverrideGrandKing, true);
  });
});
