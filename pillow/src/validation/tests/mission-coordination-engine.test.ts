import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  MCE_CAPABILITIES,
  MISSION_PHASES,
  MISSION_STATES,
  buildMissionCoordinationEngineConfiguration,
  createMissionCoordinationEngine,
  resetMissionCoordinationEngineForTesting,
} from "../../mission-coordination-engine/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createMissionCoordinationEngine>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createMissionCoordinationEngine(bootstrap, config);
  await engine.initialize();
  engine.connectMissionCoordinationEngine();
  return engine;
}

describe("Q0-25 Mission Coordination Engine", () => {
  beforeEach(resetMissionCoordinationEngineForTesting);

  test("1 locks mandatory mission-coordination-engine boundaries", () => {
    const c = buildMissionCoordinationEngineConfiguration(REPO_ROOT, {
      neverExecuteWorkerLogic: false as never,
      neverReplaceWorkforceOrchestrator: false as never,
      neverReplaceExecutivePlanner: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
    });
    assert.equal(c.neverExecuteWorkerLogic, true);
    assert.equal(c.neverReplaceWorkforceOrchestrator, true);
    assert.equal(c.neverReplaceExecutivePlanner, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
  });

  test("2 initializes PILLOW-MCE-001 for Q0-25", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q0-25");
    assert.equal(state.engineVersion, "PILLOW-MCE-001");
    for (const status of MISSION_STATES) {
      assert.ok(state.configuration.missionStates.includes(status));
    }
    for (const phase of MISSION_PHASES) {
      assert.ok(state.configuration.missionPhases.includes(phase));
    }
  });

  test("3 creates a mission from a plan", async () => {
    const report = (await build()).createMission({
      businessId: "biz-marketplace",
      missionName: "Regional Expansion Mission",
      missionOwner: "wcr-wkr-strategy-01",
      assignedWorkers: ["wcr-wkr-strategy-01", "wcr-wkr-ops-01"],
      validated: true,
    });
    assert.ok(report.records[0]!.missionId.startsWith("mce-msn-"));
    assert.equal(report.records[0]!.missionName, "Regional Expansion Mission");
    assert.equal(report.currentPhase, "planning");
    assert.equal(report.records[0]!.completionStatus, "not_started");
  });

  test("4 mission progresses through phases", async () => {
    const engine = await build();
    const created = engine.createMission({
      businessId: "biz-marketplace",
      missionName: "Phase Progression Mission",
      missionOwner: "wcr-wkr-strategy-01",
      assignedWorkers: ["wcr-wkr-strategy-01", "wcr-wkr-ops-01"],
      validated: true,
    });
    const missionId = created.records[0]!.missionId;
    const prep = engine.advanceMissionPhase({ missionId, validated: true });
    assert.equal(prep.currentPhase, "preparation");
    const exec = engine.advanceMissionPhase({ missionId, validated: true });
    assert.equal(exec.currentPhase, "execution");
    assert.ok(exec.records[0]!.phaseHistory.includes("planning"));
    assert.ok(exec.records[0]!.phaseHistory.includes("preparation"));
    assert.ok(exec.records[0]!.phaseHistory.includes("execution"));
  });

  test("5 worker dependencies are tracked", async () => {
    const engine = await build();
    engine.createMission({
      businessId: "biz-marketplace",
      missionName: "Dependency Mission",
      missionOwner: "wcr-wkr-strategy-01",
      assignedWorkers: ["wcr-wkr-strategy-01"],
      dependencies: [
        { workerId: "wcr-wkr-ops-01", dependsOn: ["wcr-wkr-strategy-01"] },
        { workerId: "wcr-wkr-finance-01", dependsOn: ["wcr-wkr-ops-01"] },
      ],
      validated: true,
    });
    const tracked = engine.trackWorkerDependencies({
      assignedWorkers: ["wcr-wkr-strategy-01", "wcr-wkr-ops-01", "wcr-wkr-finance-01"],
      dependencies: [
        { workerId: "wcr-wkr-ops-01", dependsOn: ["wcr-wkr-strategy-01"] },
        { workerId: "wcr-wkr-finance-01", dependsOn: ["wcr-wkr-ops-01"] },
      ],
      validated: true,
    });
    assert.ok(tracked.records[0]!.dependencies.every((d) => d.satisfied));
    assert.ok(!tracked.records[0]!.blockers.includes("unsatisfied_worker_dependencies"));
  });

  test("6 approval checkpoint is handled", async () => {
    const engine = await build();
    const created = engine.createMission({
      businessId: "biz-marketplace",
      missionName: "Approval Mission",
      missionOwner: "wcr-wkr-strategy-01",
      assignedWorkers: ["wcr-wkr-strategy-01"],
      approvalCheckpoints: [{ name: "Executive Approval", required: true }],
      validated: true,
    });
    const missionId = created.records[0]!.missionId;
    engine.advanceMissionPhase({ missionId, validated: true }); // preparation
    engine.advanceMissionPhase({ missionId, validated: true }); // execution
    engine.advanceMissionPhase({ missionId, validated: true }); // review
    const approvalPhase = engine.advanceMissionPhase({ missionId, validated: true }); // approval
    assert.equal(approvalPhase.currentPhase, "approval");
    const approved = engine.handleApprovalCheckpoint({
      missionId,
      approvedBy: "pillow",
      validated: true,
    });
    assert.ok(approved.records[0]!.approvalCheckpoints.every((c) => c.approved));
    assert.equal(approved.records[0]!.approvalCheckpoints[0]!.approvedBy, "pillow");
  });

  test("7 mission completed after approvals", async () => {
    const engine = await build();
    const created = engine.createMission({
      businessId: "biz-marketplace",
      missionName: "Completion Mission",
      missionOwner: "wcr-wkr-strategy-01",
      assignedWorkers: ["wcr-wkr-strategy-01"],
      validated: true,
    });
    const missionId = created.records[0]!.missionId;
    engine.handleApprovalCheckpoint({ missionId, approvedBy: "pillow", validated: true });
    const completed = engine.completeMission({ missionId, validated: true });
    assert.equal(completed.completionStatus, "completed");
    assert.equal(completed.currentPhase, "completion");
    assert.equal(completed.missionStatus, "completed");
  });

  test("8 mission closed after completion", async () => {
    const engine = await build();
    const created = engine.createMission({
      businessId: "biz-marketplace",
      missionName: "Closure Mission",
      missionOwner: "wcr-wkr-strategy-01",
      assignedWorkers: ["wcr-wkr-strategy-01"],
      validated: true,
    });
    const missionId = created.records[0]!.missionId;
    engine.handleApprovalCheckpoint({ missionId, approvedBy: "pillow", validated: true });
    engine.completeMission({ missionId, validated: true });
    const closed = engine.closeMission({ missionId, validated: true });
    assert.equal(closed.completionStatus, "closed");
    assert.equal(closed.currentPhase, "closure");
    assert.equal(closed.records[0]!.progress, 100);
  });

  test("9 rejects execute / orchestrator / planner / Pillow / Grand King boundaries", async () => {
    const engine = await build();
    const base = {
      businessId: "biz-marketplace",
      missionName: "Boundary Mission",
      missionOwner: "wcr-wkr-strategy-01",
      validated: true,
    };
    assert.equal(
      engine.createMission({ ...base, executeWorkerLogic: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.advanceMissionPhase({
        ...base,
        replaceWorkforceOrchestrator: true,
      }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.completeMission({ ...base, replaceExecutivePlanner: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.handleApprovalCheckpoint({ ...base, overridePillow: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.closeMission({ ...base, overrideGrandKing: true }).validation.decision,
      "fail",
    );
    assert.ok(MCE_CAPABILITIES.includes("extensible_mission_states"));
  });

  test("10 produces machine-readable mission records and validates them", async () => {
    const engine = await build();
    engine.createMission({
      businessId: "biz-marketplace",
      missionName: "Validation Mission",
      missionOwner: "wcr-wkr-strategy-01",
      assignedWorkers: ["wcr-wkr-strategy-01", "wcr-wkr-ops-01"],
      approvalCheckpoints: [{ name: "Executive Approval", required: true }],
      validated: true,
    });
    const validation = engine.validateMissionCoordinationEngine({ validated: true });
    assert.ok(
      validation.validation.decision === "pass" || validation.validation.decision === "partial",
    );
    assert.equal(engine.getRecords().length, 1);
    const record = engine.getLatestRecord()!;
    assert.equal(record.workerLogicExecuted, false);
    assert.equal(record.workforceOrchestratorReplaced, false);
    assert.equal(record.executivePlannerReplaced, false);
    assert.equal(record.pillowOverridden, false);
    assert.equal(record.grandKingOverridden, false);
    assert.equal(record.metadataVersion, "MCE-001-v1");
    assert.ok(record.missionId);
    assert.ok(record.timestamp);
    assert.ok(record.businessId);
    assert.ok(record.missionName);
    assert.ok(record.missionOwner);
    assert.ok(record.missionStatus);
    assert.ok(record.currentPhase);
    assert.ok(Array.isArray(record.assignedWorkers));
    assert.ok(Array.isArray(record.dependencies));
    assert.ok(Array.isArray(record.approvalCheckpoints));
    assert.ok(typeof record.progress === "number");
    assert.ok(Array.isArray(record.blockers));
    assert.ok(record.completionStatus);
  });
});
