import assert from "node:assert/strict";
import { join } from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  CSGEN_CAPABILITIES,
  CSGEN_METADATA_VERSION,
  CURSOR_SPECIFICATION_GENERATOR_REPORT_VERSION,
  CONSTITUTIONAL_SECTIONS,
  buildCursorSpecificationGeneratorConfiguration,
  createCursorSpecificationGenerator,
  isForbiddenMissionId,
  resetCursorSpecificationGeneratorForTesting,
  type CsgenInput,
  type CursorSpecificationGeneratorDependencies,
} from "../../cursor-specification-generator/index.js";

const REPO_ROOT = join(import.meta.dirname, "..", "..", "..", "..");

function sampleInput(overrides: Partial<CsgenInput> = {}): CsgenInput {
  return {
    missionId: "Q13-04",
    missionName: "Cursor Specification Generator",
    deliverable: "Governed Cursor specification generation module at pillow/src/cursor-specification-generator/",
    programme: "Q13",
    programmeId: "Q13",
    teamId: "pillow",
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
      specifications: [{ specId: "spec-1", missionId: "Q13-01", missionName: "Implementation Specification Engine" }],
    }),
  };
}

function mpengStub() {
  return {
    getQ1304ConsumableContract: () => ({
      contractVersion: "MPENG-001-v1",
      consumerMissionId: "Q13-04",
      exposedFields: ["missionSummary", "executionPlan", "plans", "validationStrategy", "acceptanceCriteria"],
      neverImplementQ1304OrLater: true,
      planningPrerequisite: true,
    }),
    getLatestReport: () => ({
      reportId: "mpeng-rpt-01",
      confidenceScore: 0.85,
      plans: [{
        planId: "plan-1",
        missionId: "Q13-04",
        missionName: "Cursor Specification Generator",
        executionOrder: [],
        acceptanceCriteria: [{ description: "CSGEN tests pass 12/12" }],
        validationStrategy: [{ description: "MPENG regression 12/12" }],
      }],
      missionSummary: { missionId: "Q13-04", missionName: "Cursor Specification Generator" },
    }),
  };
}

function csgenDeps(overrides: Partial<CursorSpecificationGeneratorDependencies> = {}): CursorSpecificationGeneratorDependencies {
  return {
    missionPlanningEngine: mpengStub(),
    repositoryIntelligenceEngine: riengStub(),
    implementationSpecificationEngine: isengStub(),
    pillowOrchestrationRuntime: {
      getTopology: () => ({ workflows: [{ id: "wf-01" }] }),
      getState: () => ({ status: "active" }),
    },
    auditRuntime: { getState: () => ({ status: "active" }) },
    executiveReportingRuntime: {
      submitWorkerReport: () => ({ records: [{ reportId: "ert-csgen-test" }] }),
    },
    approvalRuntime: { getState: () => ({ status: "active", pendingApprovals: 1 }) },
    grandKingAcceptanceGate: { getAcceptanceStatus: () => ({ status: "pending", approved: false }) },
    ...overrides,
  };
}

async function build(deps?: CursorSpecificationGeneratorDependencies) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  if (bootstrap.status !== "ready") {
    throw new Error("Bootstrap failed to reach ready state for Cursor Specification Generator tests");
  }
  const engine = createCursorSpecificationGenerator(bootstrap, { dependencies: deps });
  await engine.initialize();
  engine.connect();
  return engine;
}

describe("Q13-04 Cursor Specification Generator", () => {
  beforeEach(resetCursorSpecificationGeneratorForTesting);

  test("1 locks boundaries (neverImplementCode, neverExecuteCursorMissions, neverImplementQ1305OrLater, neverSelfApprove, neverInventMissions, etc.)", () => {
    const c = buildCursorSpecificationGeneratorConfiguration(REPO_ROOT, {
      neverImplementCode: false as never,
      neverExecuteCursorMissions: false as never,
      neverImplementQ1305OrLater: false as never,
    });
    assert.equal(c.neverImplementCode, true);
    assert.equal(c.neverExecuteCursorMissions, true);
    assert.equal(c.neverImplementQ1305OrLater, true);
    assert.equal(c.neverSelfApprove, true);
    assert.equal(c.neverInventMissions, true);
    assert.equal(c.neverFabricateRepositoryFindings, true);
    assert.equal(c.neverBypassGovernance, true);
    assert.equal(c.specificationOnly, true);
  });

  test("2 initializes PILLOW-CSGEN-001 Q13-04", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q13-04");
    assert.equal(state.engineVersion, "PILLOW-CSGEN-001");
    assert.equal(state.configuration.workerId, "wkr-cursor-specification-generator-01");
    assert.equal(state.configuration.factory, "cursor-specification-generator");
    assert.ok(CSGEN_CAPABILITIES.includes("consume_approved_roadmap_mission"));
    assert.ok(CSGEN_CAPABILITIES.includes("consume_q1304_contract"));
    assert.ok(CSGEN_CAPABILITIES.includes("expose_q1305_consumable_contract"));
    assert.ok(CSGEN_CAPABILITIES.includes("never_implement_code"));
  });

  test("3 consume approved roadmap mission (preserves terminology)", async () => {
    const engine = await build(csgenDeps());
    const mission = engine.consumeApprovedRoadmapMission(sampleInput());
    assert.equal(mission.missionId, "Q13-04");
    assert.equal(mission.missionName, "Cursor Specification Generator");
    assert.ok(mission.deliverable.includes("cursor-specification-generator"));
    assert.equal(mission.programme, "Q13");
    assert.equal(mission.evidenceProvided, true);
  });

  test("4 consume RIENG + MPENG + ISENG inputs", async () => {
    const engine = await build(csgenDeps());
    const rieng = engine.consumeRepositoryIntelligence();
    assert.equal(rieng.q1303ContractConsumed.consumed, true);
    assert.equal(rieng.repositorySnapshot.status, "available");
    assert.equal(rieng.repositorySnapshot.repositorySnapshotId, "snap-1");

    const mpeng = engine.consumeMissionPlanning();
    assert.equal(mpeng.q1304ContractConsumed.consumed, true);
    assert.equal(mpeng.q1304ContractConsumed.consumerMissionId, "Q13-04");
    assert.equal(mpeng.missionPlanReference.planId, "plan-1");

    const iseng = engine.consumeImplementationSpecification();
    assert.equal(iseng.q1302Observation.consumed, true);
    assert.equal(iseng.implementationSpecificationReference.specIds.length, 1);
  });

  test("5 generate complete Cursor specification with constitutional structure sections", async () => {
    const engine = await build(csgenDeps());
    engine.consumeApprovedRoadmapMission(sampleInput());
    const spec = engine.generateCursorSpecification(sampleInput());
    assert.ok(spec);
    assert.ok(spec!.cursorSpecificationId);
    assert.equal(spec!.missionId, "Q13-04");
    assert.equal(spec!.missionName, "Cursor Specification Generator");
    assert.ok(spec!.constitutionalBody.length > 0);
    for (const section of CONSTITUTIONAL_SECTIONS) {
      assert.ok(spec!.constitutionalBody.includes(`## ${section}`), `missing section: ${section}`);
    }
  });

  test("6 preserve deliverable/mission name; stop-before-next-mission present; one-mission boundary", async () => {
    const engine = await build(csgenDeps());
    engine.consumeApprovedRoadmapMission(sampleInput());
    const spec = engine.generateCursorSpecification(sampleInput());
    assert.ok(spec);
    assert.ok(spec!.deliverable.includes("cursor-specification-generator"));
    assert.equal(spec!.missionName, "Cursor Specification Generator");
    assert.ok(spec!.constitutionalBody.includes("Stop before next mission"));
    assert.ok(spec!.stopBoundary.includes("Q13-04"));
    assert.ok(spec!.constitutionalBody.includes("Implement ONLY this mission"));
    assert.ok(spec!.constitutionalBody.includes("Q13-04"));
  });

  test("7 missing mandatory evidence blocks generation", async () => {
    const engine = await build(csgenDeps({ missionPlanningEngine: undefined }));
    engine.consumeApprovedRoadmapMission(sampleInput());
    const spec = engine.generateCursorSpecification({ ...sampleInput(), pillowCommandConfirmed: false });
    assert.equal(spec, null);

    const report = await engine.produceReport({ ...sampleInput(), pillowCommandConfirmed: false });
    assert.equal(report.generatedCursorSpecification, null);
    assert.ok(report.outstandingIssues.length >= 1);
    assert.ok(report.outstandingIssues.some((i) => i.includes("pillowCommandConfirmed") || i.includes("Q1304") || i.includes("withheld")));
  });

  test("8 full Cursor Specification Report + consumableByQ1305", async () => {
    const engine = await build(csgenDeps());
    engine.consumeApprovedRoadmapMission(sampleInput());
    const report = await engine.produceReport(sampleInput());
    assert.equal(report.q1304ContractConsumed.consumed, true);
    assert.equal(report.consumableByQ1305, true);
    assert.equal(report.neverImplementQ1305OrLater, true);
    assert.equal(report.neverImplementCode, true);
    assert.equal(report.neverExecuteCursorMissions, true);
    assert.equal(report.metadataVersion, CSGEN_METADATA_VERSION);
    assert.equal(report.reportVersion, CURSOR_SPECIFICATION_GENERATOR_REPORT_VERSION);
    assert.equal(report.engineId, "PILLOW-CSGEN-001");
    assert.ok(report.generatedCursorSpecification);
    assert.notEqual(report.validation.decision, "failed");
    assert.ok(report.confidenceScore > 0);
    assert.equal(report.governanceValidation.approvalStatus, "pending_grand_king");
  });

  test("9 consume Q1304; never claim Q13-05 implemented; never self-approve", async () => {
    const engine = await build(csgenDeps());
    engine.consumeApprovedRoadmapMission(sampleInput());
    const report = await engine.produceReport(sampleInput());
    assert.equal(report.q1304ContractConsumed.consumed, true);
    assert.ok(report.q1304ContractConsumed.fields.length > 0);
    assert.equal(report.generationPrerequisite.missionPlanningEnginePresent, true);
    assert.notEqual(report.generatedCursorSpecification?.approvalStatus, "approved");
    assert.equal(report.generatedCursorSpecification?.approvalStatus, "pending_grand_king");
    const serialized = JSON.stringify(report).toLowerCase();
    assert.ok(!serialized.includes("q13-05 implemented"));
    assert.ok(!serialized.includes("cursor mission executor implemented"));
  });

  test("10 Q1305 contract without implementing Q13-05", async () => {
    const engine = await build(csgenDeps());
    engine.consumeApprovedRoadmapMission(sampleInput());
    await engine.produceReport(sampleInput());
    const contract = engine.getQ1305ConsumableContract();
    assert.equal(contract.producedBy, "cursor-specification-generator");
    assert.equal(contract.missionId, "Q13-04");
    assert.equal(contract.consumerMissionId, "Q13-05");
    assert.equal(contract.neverImplementQ1305OrLater, true);
    assert.equal(contract.structuralSignalOnly, true);
    assert.ok(contract.exposedFields.length > 0);
    assert.ok(!JSON.stringify(contract).toLowerCase().includes("q13-05 implemented"));
  });

  test("11 reject invent/rename/alter deliverable/fabricate/bypass governance/execute", async () => {
    const engine = await build(csgenDeps());
    engine.consumeApprovedRoadmapMission(sampleInput());
    for (const forbidden of [
      { fabricateRepositoryFindings: true },
      { inventMission: true },
      { renameMission: true },
      { alterDeliverable: true },
      { implementCode: true },
      { executeCursorMission: true },
      { bypassGovernance: true },
      { selfApprove: true },
      { implementQ1305OrLater: true },
      { missionId: "Q13-05" },
      { missionId: "Q14-01" },
    ] as Partial<CsgenInput>[]) {
      const report = await engine.produceReport({ ...sampleInput(), ...forbidden });
      assert.equal(report.validation.decision, "failed");
      assert.ok(report.validation.errors.length >= 1);
    }
  });

  test("12 reject Q13-05+; cockpit + specification history", async () => {
    const engine = await build(csgenDeps());
    engine.consumeApprovedRoadmapMission(sampleInput());
    await engine.produceReport(sampleInput());
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q13-04");
    assert.equal(cockpit.neverImplementCode, true);
    assert.equal(cockpit.neverExecuteCursorMissions, true);
    assert.equal(cockpit.neverImplementQ1305OrLater, true);
    assert.equal(cockpit.neverSelfApprove, true);
    assert.equal(cockpit.neverBypassGovernance, true);
    assert.ok(cockpit.totalReports >= 1);
    assert.ok(cockpit.totalSpecifications >= 1);
    const history = engine.getSpecificationHistory();
    assert.ok(history.length >= 1);
    const diagnostics = engine.runDiagnostics();
    assert.equal(diagnostics.missionId, "Q13-04");
    assert.equal(diagnostics.q1304PrerequisitePresent, true);
    assert.equal(isForbiddenMissionId("Q13-04"), false);
    assert.equal(isForbiddenMissionId("Q13-05"), true);
    assert.equal(isForbiddenMissionId("Q14-01"), true);
  });
});
