import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  MISSION_LIFECYCLE_STATES,
  MISSION_TYPES,
  MSR_CAPABILITIES,
  MSR_METADATA_VERSION,
  MSR_REPORT_VERSION,
  MSR_RUNTIME_VERSION,
  INTEGRATION_TARGETS,
  buildMissionRuntimeConfiguration,
  createMissionRuntime,
  resetMissionRuntimeForTesting,
  canTransition,
  type MsrInput,
  type MissionRuntimeDependencies,
} from "../../mission-runtime/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

function sampleInput(overrides: Partial<MsrInput> = {}): MsrInput {
  return {
    pillowConfirmed: true,
    grandKingApproved: true,
    validated: true,
    ...overrides,
  };
}

async function build(deps?: MissionRuntimeDependencies) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createMissionRuntime(bootstrap, deps ? { dependencies: deps } : undefined);
  await engine.initialize();
  engine.connect();
  return engine;
}

describe("Q10-03 Mission Runtime", () => {
  beforeEach(resetMissionRuntimeForTesting);

  test("1 locks mandatory boundaries", () => {
    const c = buildMissionRuntimeConfiguration(REPO_ROOT, {
      neverReplaceWorkerLogic: false as never,
      neverReplaceOrchestrationLogic: false as never,
      neverExecuteUnauthorisedMissions: false as never,
      neverFabricateMissionState: false as never,
      neverBypassPillowGovernance: false as never,
      neverBypassGrandKingApproval: false as never,
      neverImplementQ1004OrLater: false as never,
      deterministicTransitionsOnly: false as never,
    });
    assert.equal(c.neverReplaceWorkerLogic, true);
    assert.equal(c.neverReplaceOrchestrationLogic, true);
    assert.equal(c.neverExecuteUnauthorisedMissions, true);
    assert.equal(c.neverFabricateMissionState, true);
    assert.equal(c.neverBypassPillowGovernance, true);
    assert.equal(c.neverBypassGrandKingApproval, true);
    assert.equal(c.neverOverrideApprovedArchitecture, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ1004OrLater, true);
    assert.equal(c.preserveCompleteTraceability, true);
    assert.equal(c.preserveMissionHistory, true);
    assert.equal(c.preserveAuditHistory, true);
    assert.equal(c.structuralSignalOnly, true);
    assert.equal(c.neverExposeCredentials, true);
    assert.equal(c.maskSensitiveValues, true);
    assert.equal(c.deterministicTransitionsOnly, true);
    assert.equal(c.maxRetries, 3);
  });

  test("2 initializes PILLOW-MSR-001 Q10-03", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q10-03");
    assert.equal(state.engineVersion, "PILLOW-MSR-001");
    assert.equal(state.configuration.workerId, "wkr-mission-runtime-01");
    assert.equal(state.configuration.factory, "pillow-mission");
    for (const target of INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    assert.ok(MSR_CAPABILITIES.includes("create_missions"));
    assert.ok(MSR_CAPABILITIES.includes("q1004_consumable_contract"));
    assert.equal(MISSION_LIFECYCLE_STATES.length, 13);
    assert.equal(MISSION_TYPES.length, 5);
    assert.ok(canTransition("Created", "Queued"));
    assert.ok(!canTransition("Created", "Running"));
  });

  test("3 mission creation succeeds", async () => {
    const engine = await build();
    const report = engine.createMission(
      sampleInput({ missionName: "Test Enterprise Mission", missionType: "enterprise" }),
    );
    assert.equal(report.decision, "pass");
    assert.ok(report.mission);
    assert.equal(report.mission!.currentStatus, "Created");
    assert.equal(report.mission!.fabricated, false);
    assert.equal(report.mission!.missionType, "enterprise");
  });

  test("4 mission execution succeeds (Created→…→Running→Completed path)", async () => {
    const engine = await build({
      pillowOrchestrationRuntime: {
        invokeWorker: () => ({ decision: "pass" }),
      },
    });
    const created = engine.createMission(sampleInput({ missionName: "Execute Path Mission" }));
    const missionId = created.mission!.missionId;
    const report = engine.execute({ ...sampleInput(), missionId });
    assert.equal(report.decision, "pass");
    assert.ok(report.mission);
    assert.equal(report.mission!.currentStatus, "Completed");
    assert.ok(report.transitions.length >= 4);
    assert.ok(report.transitions.some((t) => t.fromState === "Created" && t.toState === "Queued"));
    assert.ok(report.transitions.some((t) => t.toState === "Running"));
    assert.ok(report.transitions.some((t) => t.toState === "Completed"));
  });

  test("5 pause and resume function correctly", async () => {
    const engine = await build();
    const created = engine.createMission(sampleInput({ missionName: "Pause Resume Mission" }));
    const missionId = created.mission!.missionId;
    engine.execute({ ...sampleInput(), missionId, completeAfterRun: false });
    const paused = engine.pause({ ...sampleInput(), missionId });
    assert.equal(paused.decision, "pass");
    assert.equal(paused.mission!.currentStatus, "Paused");
    const resumed = engine.resume({ ...sampleInput(), missionId });
    assert.equal(resumed.decision, "pass");
    assert.equal(resumed.mission!.currentStatus, "Running");
    assert.ok(resumed.transitions.some((t) => t.fromState === "Paused" && t.toState === "Resumed"));
    assert.ok(resumed.transitions.some((t) => t.fromState === "Resumed" && t.toState === "Running"));
  });

  test("6 retry logic functions correctly (Failed→Retrying→Running)", async () => {
    const engine = await build();
    const created = engine.createMission(sampleInput({ missionName: "Retry Mission" }));
    const missionId = created.mission!.missionId;
    engine.execute({ ...sampleInput(), missionId, forceFail: true });
    const mission = engine.getHistory().missions.find((m) => m.missionId === missionId);
    assert.equal(mission!.currentStatus, "Failed");
    const retried = engine.retry({ ...sampleInput(), missionId });
    assert.equal(retried.decision, "pass");
    assert.ok(retried.transitions.some((t) => t.fromState === "Failed" && t.toState === "Retrying"));
    assert.ok(retried.transitions.some((t) => t.fromState === "Retrying" && t.toState === "Running"));
    assert.equal(retried.mission!.currentStatus, "Completed");
  });

  test("7 cancellation functions safely", async () => {
    const engine = await build();
    const created = engine.createMission(sampleInput({ missionName: "Cancel Mission" }));
    const missionId = created.mission!.missionId;
    engine.execute({ ...sampleInput(), missionId, completeAfterRun: false });
    const cancelled = engine.cancel({ ...sampleInput(), missionId });
    assert.equal(cancelled.decision, "pass");
    assert.equal(cancelled.mission!.currentStatus, "Cancelled");
  });

  test("8 recovery restores interrupted missions", async () => {
    const engine = await build();
    const created = engine.createMission(sampleInput({ missionName: "Recovery Mission" }));
    const missionId = created.mission!.missionId;
    engine.execute({ ...sampleInput(), missionId, completeAfterRun: false, checkpointLabel: "pre-recovery" });
    const recovered = engine.recover({ ...sampleInput(), missionId });
    assert.equal(recovered.decision, "pass");
    assert.ok(recovered.transitions.some((t) => t.toState === "Recovered"));
    assert.ok(["Running", "Paused"].includes(recovered.mission!.currentStatus));
    const history = engine.getHistory();
    assert.ok(history.recoveries.length >= 1);
    assert.ok(history.checkpoints.length >= 1);
  });

  test("9 mission history preserved + full Mission Runtime Report + consumableByQ1004", async () => {
    const engine = await build();
    const created = engine.createMission(sampleInput({ missionName: "Report Mission", missionType: "orchestration" }));
    const missionId = created.mission!.missionId;
    engine.execute({ ...sampleInput(), missionId });
    const report = engine.produceReport({ ...sampleInput(), missionId });
    assert.equal(report.decision, "pass");
    const mrt = report.missionRuntimeReport;
    assert.ok(mrt);
    assert.ok(mrt!.reportId.startsWith("msr-rpt"));
    assert.ok(mrt!.timestamp);
    assert.equal(mrt!.runtimeVersion, MSR_RUNTIME_VERSION);
    assert.equal(mrt!.missionId, missionId);
    assert.equal(mrt!.missionType, "orchestration");
    assert.ok(mrt!.executionTimeline.length >= 1);
    assert.ok(typeof mrt!.progress === "number");
    assert.ok(Array.isArray(mrt!.activeWorkers));
    assert.ok(Array.isArray(mrt!.dependencies));
    assert.ok(Array.isArray(mrt!.checkpoints));
    assert.ok(Array.isArray(mrt!.retryHistory));
    assert.ok(Array.isArray(mrt!.recoveryHistory));
    assert.ok(mrt!.auditStatus);
    assert.ok(Array.isArray(mrt!.outstandingIssues));
    assert.ok(typeof mrt!.confidenceScore === "number");
    assert.equal(mrt!.metadataVersion, MSR_METADATA_VERSION);
    assert.equal(mrt!.reportVersion, MSR_REPORT_VERSION);
    assert.equal(mrt!.consumableByQ1004, true);
    assert.equal(mrt!.neverImplementQ1004OrLater, true);
    const history = engine.getHistory();
    assert.ok(history.missions.length >= 1);
    assert.ok(history.transitions.length >= 4);
    assert.ok(history.reports.length >= 1);
  });

  test("10 rejects fabrication / unauthorised high-risk execute", async () => {
    const engine = await build();
    const failReport = engine.validate(sampleInput({ forceFail: true }));
    assert.equal(failReport.decision, "fail");
    const fabReport = engine.validate(sampleInput({ fabricateState: true }));
    assert.equal(fabReport.decision, "fail");
    const created = engine.createMission(sampleInput({ highRisk: true }));
    const highRiskReport = engine.execute({
      ...sampleInput(),
      missionId: created.mission!.missionId,
      highRisk: true,
      grandKingApproved: false,
    });
    assert.equal(highRiskReport.decision, "fail");
  });

  test("11 rejects Q10-04+ mission scope", async () => {
    const engine = await build();
    const report = engine.validate(
      sampleInput({ implementQ1004OrLater: true, targetMissionId: "Q10-04" }),
    );
    assert.equal(report.decision, "fail");
    assert.ok(report.errors.some((e) => e.includes("Q10-04") || e.includes("Q10-04 or later")));
  });

  test("12 cockpit + Q1004 contract; never replaces worker/orchestration logic", async () => {
    const engine = await build({
      executiveReportingRuntime: {
        submitWorkerReport: () => ({ records: [{ reportId: "ert-msr-test" }] }),
      },
    });
    const created = engine.createMission(sampleInput({ missionName: "Contract Mission" }));
    engine.execute({ ...sampleInput(), missionId: created.mission!.missionId });
    engine.produceReport({ ...sampleInput(), missionId: created.mission!.missionId });
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q10-03");
    assert.equal(cockpit.neverReplaceWorkerLogic, true);
    assert.equal(cockpit.neverReplaceOrchestrationLogic, true);
    assert.equal(cockpit.neverFabricateMissionState, true);
    assert.equal(cockpit.neverImplementQ1004OrLater, true);
    assert.ok(cockpit.totalMissions >= 1);
    const contract = engine.getQ1004ConsumableContract();
    assert.equal(contract.consumerMissionId, "Q10-04");
    assert.equal(contract.producedBy, "mission-runtime");
    assert.equal(contract.missionId, "Q10-03");
    assert.equal(contract.neverImplementQ1004OrLater, true);
    assert.ok(contract.exposedFields.includes("executionTimeline"));
    assert.ok(contract.lifecycleStateCatalog.length >= MISSION_LIFECYCLE_STATES.length);
  });
});
