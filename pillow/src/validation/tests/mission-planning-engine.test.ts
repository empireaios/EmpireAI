import assert from "node:assert/strict";
import { join } from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  MPENG_CAPABILITIES,
  MPENG_METADATA_VERSION,
  MISSION_PLANNING_ENGINE_REPORT_VERSION,
  buildMissionPlanningEngineConfiguration,
  createMissionPlanningEngine,
  isForbiddenMissionId,
  resetMissionPlanningEngineForTesting,
  type MpengInput,
  type MissionPlanningEngineDependencies,
} from "../../mission-planning-engine/index.js";

const REPO_ROOT = join(import.meta.dirname, "..", "..", "..", "..");

function sampleInput(overrides: Partial<MpengInput> = {}): MpengInput {
  return {
    missionId: "Q13-03",
    missionName: "Mission Planning Engine",
    programme: "Q13",
    pillowCommandConfirmed: true,
    validated: true,
    ...overrides,
  };
}

function riengStub() {
  return {
    getQ1303ConsumableContract: () => ({
      contractVersion: "RIENG-001-v1",
      consumerMissionId: "Q13-03",
      exposedFields: ["repositorySummary", "snapshot", "dependencySummary"],
      neverImplementQ1303OrLater: true,
      repositoryPrerequisite: true,
    }),
    getLatestReport: () => ({
      reportId: "rieng-rpt-01",
      confidenceScore: 0.85,
      snapshot: {
        repositorySnapshotId: "snap-1",
        repositoryFingerprint: "fp1",
        repositoryVersion: "v1",
        moduleInventory: [],
        serviceInventory: [],
      },
      repositorySummary: { totalFiles: 10, totalModules: 2 },
      dependencySummary: { nodeCount: 5, edgeCount: 8 },
    }),
  };
}

function isengStub() {
  return {
    getQ1302ConsumableContract: () => ({
      contractVersion: "ISENG-001-v1",
      consumerMissionId: "Q13-02",
      exposedFields: ["specifications", "architectureSummary"],
      neverImplementQ1302OrLater: true,
    }),
    getLatestReport: () => ({
      reportId: "iseng-rpt-01",
      specifications: [{ specId: "spec-1" }],
    }),
  };
}

function mpengDeps(overrides: Partial<MissionPlanningEngineDependencies> = {}): MissionPlanningEngineDependencies {
  return {
    repositoryIntelligenceEngine: riengStub(),
    implementationSpecificationEngine: isengStub(),
    pillowOrchestrationRuntime: {
      getTopology: () => ({ workflows: [{ id: "wf-01" }] }),
      getState: () => ({ status: "active" }),
    },
    auditRuntime: { getState: () => ({ status: "active" }) },
    executiveReportingRuntime: {
      submitWorkerReport: () => ({ records: [{ reportId: "ert-mpeng-test" }] }),
    },
    ...overrides,
  };
}

async function build(deps?: MissionPlanningEngineDependencies) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  if (bootstrap.status !== "ready") {
    throw new Error("Bootstrap failed to reach ready state for Mission Planning Engine tests");
  }
  const engine = createMissionPlanningEngine(bootstrap, { dependencies: deps });
  await engine.initialize();
  engine.connect();
  return engine;
}

describe("Q13-03 Mission Planning Engine", () => {
  beforeEach(resetMissionPlanningEngineForTesting);

  test("1 locks boundaries (neverModifyRepository, neverImplementQ1304OrLater, neverBypassGovernance, etc.)", () => {
    const c = buildMissionPlanningEngineConfiguration(REPO_ROOT, {
      neverModifyRepository: false as never,
      neverExecuteImplementation: false as never,
      neverImplementQ1304OrLater: false as never,
    });
    assert.equal(c.neverModifyRepository, true);
    assert.equal(c.neverExecuteImplementation, true);
    assert.equal(c.neverImplementQ1304OrLater, true);
    assert.equal(c.neverBypassGovernance, true);
    assert.equal(c.neverFabricateRepositoryState, true);
    assert.equal(c.planningOnly, true);
    assert.equal(c.neverAutoDeploy, true);
  });

  test("2 initializes PILLOW-MPENG-001 Q13-03", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q13-03");
    assert.equal(state.engineVersion, "PILLOW-MPENG-001");
    assert.equal(state.configuration.workerId, "wkr-mission-planning-engine-01");
    assert.equal(state.configuration.factory, "mission-planning-engine");
    assert.ok(MPENG_CAPABILITIES.includes("analyse_approved_mission"));
    assert.ok(MPENG_CAPABILITIES.includes("consume_q1303_contract"));
    assert.ok(MPENG_CAPABILITIES.includes("expose_q1304_consumable_contract"));
    assert.ok(MPENG_CAPABILITIES.includes("never_modify_repository"));
  });

  test("3 analyse approved mission", async () => {
    const engine = await build(mpengDeps());
    const analysis = engine.analyseApprovedMission(sampleInput());
    assert.equal(analysis.missionId, "Q13-03");
    assert.equal(analysis.missionName, "Mission Planning Engine");
    assert.equal(analysis.programme, "Q13");
    assert.equal(analysis.evidenceProvided, true);
  });

  test("4 consume repository intelligence (Q1303)", async () => {
    const engine = await build(mpengDeps());
    const consumed = engine.consumeRepositoryIntelligence();
    assert.equal(consumed.q1303ContractConsumed.consumed, true);
    assert.equal(consumed.q1303ContractConsumed.consumerMissionId, "Q13-03");
    assert.ok(consumed.q1303ContractConsumed.fields.length > 0);
    assert.equal(consumed.repositorySnapshot.status, "available");
    assert.equal(consumed.repositorySnapshot.repositorySnapshotId, "snap-1");
  });

  test("5 identify dependencies + execution sequence", async () => {
    const engine = await build(mpengDeps());
    engine.analyseApprovedMission(sampleInput());
    const dependencies = engine.identifyImplementationDependencies();
    const sequence = engine.determineExecutionSequence();
    assert.ok(dependencies.length >= 2);
    assert.ok(dependencies.some((d) => d.kind === "repository_intelligence"));
    assert.equal(sequence.length, 6);
    assert.equal(sequence[0].stepId, "parse_mission");
    assert.equal(sequence[5].stepId, "accept");
    assert.ok(sequence.every((s) => s.deterministic));
  });

  test("6 identify integration points", async () => {
    const engine = await build(mpengDeps());
    const points = engine.identifyIntegrationPoints();
    assert.ok(points.length >= 5);
    assert.ok(points.some((p) => p.target.includes("session.ts")));
    assert.ok(points.some((p) => p.target === "repositoryIntelligenceEngine"));
  });

  test("7 produce validation strategy + acceptance criteria", async () => {
    const engine = await build(mpengDeps());
    engine.analyseApprovedMission(sampleInput());
    const strategy = engine.produceValidationStrategy();
    const criteria = engine.produceAcceptanceCriteria();
    assert.ok(strategy.length >= 4);
    assert.ok(criteria.length >= 4);
    assert.ok(strategy.some((s) => s.category === "regression"));
    assert.ok(criteria.some((c) => c.section === "Q1304 Contract"));
  });

  test("8 generate complete mission plan + full report consumableByQ1304", async () => {
    const engine = await build(mpengDeps());
    engine.analyseApprovedMission(sampleInput());
    const plan = engine.generateMissionPlan(sampleInput());
    assert.ok(plan.planId);
    assert.equal(plan.missionId, "Q13-03");
    assert.ok(plan.dependencies.length >= 1);
    assert.equal(plan.executionOrder.length, 6);
    assert.ok(plan.integrationPoints.length >= 1);
    assert.ok(plan.validationStrategy.length >= 1);
    assert.ok(plan.acceptanceCriteria.length >= 1);
    assert.ok(plan.risks.length >= 1);
    assert.ok(plan.repositorySnapshot);

    const report = await engine.produceReport(sampleInput());
    assert.equal(report.q1303ContractConsumed.consumed, true);
    assert.equal(report.consumableByQ1304, true);
    assert.equal(report.neverImplementQ1304OrLater, true);
    assert.equal(report.neverModifyRepository, true);
    assert.equal(report.neverExecuteImplementation, true);
    assert.equal(report.metadataVersion, MPENG_METADATA_VERSION);
    assert.equal(report.reportVersion, MISSION_PLANNING_ENGINE_REPORT_VERSION);
    assert.equal(report.engineId, "PILLOW-MPENG-001");
    assert.ok(report.plans.length >= 1);
    assert.notEqual(report.validation.decision, "fail");
    assert.ok(report.confidenceScore > 0);
  });

  test("9 consume Q1303; never claim Q13-04 implemented", async () => {
    const engine = await build(mpengDeps());
    const report = await engine.produceReport(sampleInput());
    assert.equal(report.q1303ContractConsumed.consumed, true);
    assert.ok(report.q1303ContractConsumed.fields.length > 0);
    assert.equal(report.q1303Prerequisite.repositoryIntelligenceEnginePresent, true);
    const serialized = JSON.stringify(report).toLowerCase();
    assert.ok(!serialized.includes("q13-04 implemented"));
    assert.ok(!serialized.includes("cursor specification generator implemented"));
  });

  test("10 Q1304 contract without implementing Q13-04", async () => {
    const engine = await build(mpengDeps());
    const contract = engine.getQ1304ConsumableContract();
    assert.equal(contract.producedBy, "mission-planning-engine");
    assert.equal(contract.missionId, "Q13-03");
    assert.equal(contract.consumerMissionId, "Q13-04");
    assert.equal(contract.neverImplementQ1304OrLater, true);
    assert.equal(contract.structuralSignalOnly, true);
    assert.ok(contract.exposedFields.length > 0);
    assert.ok(!JSON.stringify(contract).toLowerCase().includes("q13-04 implemented"));
  });

  test("11 reject fabricate/modify/execute/bypass governance / ignore dependencies", async () => {
    const engine = await build(mpengDeps());
    for (const forbidden of [
      { fabricateRepositoryState: true },
      { modifyRepository: true },
      { executeImplementation: true },
      { bypassGovernance: true },
      { ignoreDiscoveredDependencies: true },
      { implementQ1304OrLater: true },
      { missionId: "Q13-04" },
      { missionId: "Q14-01" },
    ] as Partial<MpengInput>[]) {
      const report = await engine.produceReport({ ...sampleInput(), ...forbidden });
      assert.equal(report.validation.decision, "fail");
      assert.ok(report.validation.errors.length >= 1);
    }
  });

  test("12 reject Q13-04+; cockpit + planning history", async () => {
    const engine = await build(mpengDeps());
    await engine.produceReport(sampleInput());
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q13-03");
    assert.equal(cockpit.neverModifyRepository, true);
    assert.equal(cockpit.neverExecuteImplementation, true);
    assert.equal(cockpit.neverImplementQ1304OrLater, true);
    assert.equal(cockpit.neverBypassGovernance, true);
    assert.ok(cockpit.totalReports >= 1);
    assert.ok(cockpit.totalPlans >= 1);
    const history = engine.getPlanningHistory();
    assert.ok(history.length >= 1);
    const diagnostics = engine.runDiagnostics();
    assert.equal(diagnostics.missionId, "Q13-03");
    assert.equal(diagnostics.q1303PrerequisitePresent, true);
    assert.equal(isForbiddenMissionId("Q13-03"), false);
    assert.equal(isForbiddenMissionId("Q13-04"), true);
    assert.equal(isForbiddenMissionId("Q14-01"), true);
  });
});
