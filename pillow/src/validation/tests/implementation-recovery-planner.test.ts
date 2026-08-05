import assert from "node:assert/strict";
import { join } from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  IRPLN_CAPABILITIES,
  IRPLN_METADATA_VERSION,
  IMPLEMENTATION_RECOVERY_PLANNER_REPORT_VERSION,
  RECOVERY_SPEC_SECTIONS,
  buildImplementationRecoveryPlannerConfiguration,
  createImplementationRecoveryPlanner,
  isForbiddenMissionId,
  resetImplementationRecoveryPlannerForTesting,
  type ImplementationRecoveryPlannerDependencies,
  type IrplnInput,
} from "../../implementation-recovery-planner/index.js";

const REPO_ROOT = join(import.meta.dirname, "..", "..", "..", "..");

function sampleInput(overrides: Partial<IrplnInput> = {}): IrplnInput {
  return {
    missionId: "Q13-05",
    missionName: "Implementation Recovery Planner",
    deliverable: "Governed implementation recovery planning module at pillow/src/implementation-recovery-planner/",
    programme: "Q13",
    interruptionReason: "interrupted mid-implementation",
    expectedPaths: [
      "pillow/src/cursor-specification-generator/",
      "pillow/src/implementation-recovery-planner/",
      "pillow/src/implementation-recovery-planner-nonexistent/",
    ],
    pillowCommandConfirmed: true,
    validated: true,
    ...overrides,
  };
}

function csgenStub() {
  return {
    getQ1305ConsumableContract: () => ({
      contractVersion: "CSGEN-001-v1",
      consumerMissionId: "Q13-05",
      exposedFields: ["generatedCursorSpecification", "missionSummary"],
      neverImplementQ1305OrLater: true,
      specificationPrerequisite: true,
    }),
    getLatestSpecification: () => ({
      cursorSpecificationId: "csgen-1",
      missionId: "Q13-05",
      missionName: "Implementation Recovery Planner",
      deliverable: "Implementation Recovery Planner module",
      architecture: [
        "pillow/src/cursor-specification-generator/",
        "pillow/src/implementation-recovery-planner/",
        "pillow/src/implementation-recovery-planner-nonexistent/",
      ],
      acceptanceCriteria: ["Recovery plan produced without executing recovery"],
    }),
    getLatestReport: () => ({ reportId: "csgen-rpt-01", confidenceScore: 0.85 }),
  };
}

function riengStub() {
  return {
    getLatestReport: () => ({
      reportId: "rieng-rpt-01",
      confidenceScore: 0.85,
      snapshot: {
        repositorySnapshotId: "snap-1",
        repositoryFingerprint: "fp1",
        repositoryVersion: "v1",
      },
    }),
  };
}

function mpengStub() {
  return {
    getLatestReport: () => ({
      reportId: "mpeng-rpt-01",
      confidenceScore: 0.85,
      plans: [{ planId: "plan-1", missionId: "Q13-05" }],
    }),
  };
}

function isengStub() {
  return {
    getLatestReport: () => ({
      reportId: "iseng-rpt-01",
      specifications: [{ specId: "spec-1", missionId: "Q13-01" }],
    }),
  };
}

function irplnDeps(overrides: Partial<ImplementationRecoveryPlannerDependencies> = {}): ImplementationRecoveryPlannerDependencies {
  return {
    cursorSpecificationGenerator: csgenStub(),
    repositoryIntelligenceEngine: riengStub(),
    implementationSpecificationEngine: isengStub(),
    missionPlanningEngine: mpengStub(),
    pillowOrchestrationRuntime: {
      getTopology: () => ({ workflows: [{ id: "wf-01" }] }),
      getState: () => ({ status: "active" }),
    },
    auditRuntime: { getState: () => ({ status: "active" }) },
    executiveReportingRuntime: {
      submitWorkerReport: () => ({ records: [{ reportId: "ert-irpln-test" }] }),
    },
    ...overrides,
  };
}

async function build(deps?: ImplementationRecoveryPlannerDependencies) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  if (bootstrap.status !== "ready") {
    throw new Error("Bootstrap failed to reach ready state for Implementation Recovery Planner tests");
  }
  const engine = createImplementationRecoveryPlanner(bootstrap, { dependencies: deps });
  await engine.initialize();
  engine.connect();
  return engine;
}

describe("Q13-05 Implementation Recovery Planner", () => {
  beforeEach(resetImplementationRecoveryPlannerForTesting);

  test("1 locks boundaries (neverExecuteRecovery, neverModifyRepository, neverImplementQ1306OrLater, neverOverwriteVerifiedImplementations, etc.)", () => {
    const c = buildImplementationRecoveryPlannerConfiguration(REPO_ROOT, {
      neverExecuteRecovery: false as never,
      neverModifyRepository: false as never,
      neverImplementQ1306OrLater: false as never,
    });
    assert.equal(c.neverExecuteRecovery, true);
    assert.equal(c.neverModifyRepository, true);
    assert.equal(c.neverImplementQ1306OrLater, true);
    assert.equal(c.neverOverwriteVerifiedImplementations, true);
    assert.equal(c.neverDeleteProductionCodeWithoutEvidence, true);
    assert.equal(c.neverRestartCompletedWorkUnnecessarily, true);
    assert.equal(c.neverFabricateRepositoryFindings, true);
    assert.equal(c.neverBypassGovernance, true);
    assert.equal(c.recoveryPlanningOnly, true);
  });

  test("2 initializes PILLOW-IRPLN-001 Q13-05", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q13-05");
    assert.equal(state.engineVersion, "PILLOW-IRPLN-001");
    assert.equal(state.configuration.workerId, "wkr-implementation-recovery-planner-01");
    assert.equal(state.configuration.factory, "implementation-recovery-planner");
    assert.ok(IRPLN_CAPABILITIES.includes("detect_interrupted_or_incomplete_mission"));
    assert.ok(IRPLN_CAPABILITIES.includes("consume_q1305_contract"));
    assert.ok(IRPLN_CAPABILITIES.includes("expose_q1306_consumable_contract"));
    assert.ok(IRPLN_CAPABILITIES.includes("never_execute_recovery"));
  });

  test("3 detect interrupted/incomplete mission", async () => {
    const engine = await build(irplnDeps());
    const mission = engine.detectInterruptedOrIncompleteMission(sampleInput());
    assert.equal(mission.missionId, "Q13-05");
    assert.equal(mission.classification, "interrupted");
    assert.ok(mission.interruptionReason.includes("interrupted"));
    assert.equal(mission.expectedPaths.length, 3);
    assert.equal(mission.evidenceProvided, true);
  });

  test("4 analyse repository state read-only", async () => {
    const engine = await build(irplnDeps());
    engine.detectInterruptedOrIncompleteMission(sampleInput());
    const snapshot = engine.analyseCurrentRepositoryState(sampleInput());
    assert.equal(snapshot.readOnly, true);
    assert.ok(snapshot.pathFindings.length >= 3);
    const csgenFinding = snapshot.pathFindings.find((f) =>
      f.path.includes("cursor-specification-generator"),
    );
    assert.ok(csgenFinding?.exists);
    assert.equal(csgenFinding?.classification, "completed");
  });

  test("5 compare against approved specification; detect completed/partial/missing", async () => {
    const engine = await build(irplnDeps());
    engine.detectInterruptedOrIncompleteMission(sampleInput());
    engine.analyseCurrentRepositoryState(sampleInput());
    const comparison = engine.compareAgainstApprovedSpecification(sampleInput());
    assert.ok(comparison.completed.length >= 1);
    assert.ok(comparison.missing.length >= 1);
    const completed = engine.detectCompletedWork();
    const missing = engine.detectMissingImplementation();
    assert.ok(completed.some((c) => c.path.includes("cursor-specification-generator")));
    assert.ok(missing.some((c) => c.path.includes("nonexistent")));
  });

  test("6 detect conflicts + generate recovery strategy (preserve completed)", async () => {
    const engine = await build(irplnDeps());
    engine.detectInterruptedOrIncompleteMission(sampleInput());
    engine.analyseCurrentRepositoryState(sampleInput());
    engine.compareAgainstApprovedSpecification(sampleInput());
    const conflicts = engine.detectConflictingImplementation();
    assert.ok(Array.isArray(conflicts));
    const strategy = engine.generateRecoveryStrategy();
    assert.ok(strategy.preserveCompleted.some((p) => p.includes("cursor-specification-generator")));
    assert.ok(strategy.principles.some((p) => p.includes("neverOverwriteVerifiedImplementations")));
    assert.ok(strategy.createMissing.some((p) => p.includes("nonexistent")));
  });

  test("7 generate recovery plan/specification with sequence + filesToPreserve", async () => {
    const engine = await build(irplnDeps());
    engine.detectInterruptedOrIncompleteMission(sampleInput());
    engine.analyseCurrentRepositoryState(sampleInput());
    engine.compareAgainstApprovedSpecification(sampleInput());
    engine.generateRecoveryStrategy();
    const plan = engine.generateRecoveryPlan(sampleInput());
    assert.ok(plan);
    assert.ok(plan!.recoverySequence.length >= 2);
    assert.ok(plan!.filesToPreserve.some((p) => p.includes("cursor-specification-generator")));
    const spec = engine.generateRecoverySpecification(sampleInput());
    assert.ok(spec);
    assert.ok(spec!.constitutionalBody.length > 0);
    for (const section of RECOVERY_SPEC_SECTIONS) {
      assert.ok(spec!.constitutionalBody.includes(`## ${section}`), `missing section: ${section}`);
    }
    assert.ok(spec!.stopBoundary.includes("do not auto-execute"));
  });

  test("8 full Recovery Report + consumableByQ1306", async () => {
    const engine = await build(irplnDeps());
    engine.detectInterruptedOrIncompleteMission(sampleInput());
    const report = await engine.produceReport(sampleInput());
    assert.equal(report.q1305ContractConsumed.consumed, true);
    assert.equal(report.consumableByQ1306, true);
    assert.equal(report.neverImplementQ1306OrLater, true);
    assert.equal(report.neverExecuteRecovery, true);
    assert.equal(report.neverModifyRepository, true);
    assert.equal(report.metadataVersion, IRPLN_METADATA_VERSION);
    assert.equal(report.reportVersion, IMPLEMENTATION_RECOVERY_PLANNER_REPORT_VERSION);
    assert.equal(report.engineId, "PILLOW-IRPLN-001");
    assert.ok(report.plans.length >= 1);
    assert.notEqual(report.validation.decision, "fail");
    assert.ok(report.confidenceScore > 0);
  });

  test("9 consume Q1305; never claim Q13-06 implemented", async () => {
    const engine = await build(irplnDeps());
    engine.detectInterruptedOrIncompleteMission(sampleInput());
    const report = await engine.produceReport(sampleInput());
    assert.equal(report.q1305ContractConsumed.consumed, true);
    assert.ok(report.q1305ContractConsumed.fields.length > 0);
    assert.equal(report.recoveryPrerequisite.cursorSpecificationGeneratorPresent, true);
    const serialized = JSON.stringify(report).toLowerCase();
    assert.ok(!serialized.includes("q13-06 implemented"));
    assert.ok(!serialized.includes("recovery executed"));
  });

  test("10 Q1306 contract without implementing Q13-06", async () => {
    const engine = await build(irplnDeps());
    engine.detectInterruptedOrIncompleteMission(sampleInput());
    await engine.produceReport(sampleInput());
    const contract = engine.getQ1306ConsumableContract();
    assert.equal(contract.producedBy, "implementation-recovery-planner");
    assert.equal(contract.missionId, "Q13-05");
    assert.equal(contract.consumerMissionId, "Q13-06");
    assert.equal(contract.neverImplementQ1306OrLater, true);
    assert.equal(contract.structuralSignalOnly, true);
    assert.ok(contract.exposedFields.length > 0);
    assert.ok(!JSON.stringify(contract).toLowerCase().includes("q13-06 implemented"));
  });

  test("11 reject overwrite/delete/execute-recovery/fabricate/bypass governance", async () => {
    const engine = await build(irplnDeps());
    engine.detectInterruptedOrIncompleteMission(sampleInput());
    for (const forbidden of [
      { fabricateRepositoryFindings: true },
      { overwriteVerifiedImplementations: true },
      { deleteProductionCode: true },
      { restartCompletedWork: true },
      { executeRecovery: true },
      { modifyRepository: true },
      { bypassGovernance: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { implementQ1306OrLater: true },
      { missionId: "Q13-06" },
      { missionId: "Q14-01" },
    ] as Partial<IrplnInput>[]) {
      const report = await engine.produceReport({ ...sampleInput(), ...forbidden });
      assert.equal(report.validation.decision, "fail");
      assert.ok(report.validation.errors.length >= 1);
    }
  });

  test("12 reject Q13-06+; cockpit + recovery history", async () => {
    const engine = await build(irplnDeps());
    engine.detectInterruptedOrIncompleteMission(sampleInput());
    await engine.produceReport(sampleInput());
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q13-05");
    assert.equal(cockpit.neverExecuteRecovery, true);
    assert.equal(cockpit.neverModifyRepository, true);
    assert.equal(cockpit.neverImplementQ1306OrLater, true);
    assert.equal(cockpit.neverOverwriteVerifiedImplementations, true);
    assert.equal(cockpit.neverBypassGovernance, true);
    assert.ok(cockpit.totalReports >= 1);
    assert.ok(cockpit.totalPlans >= 1);
    const history = engine.getRecoveryHistory();
    assert.ok(history.length >= 1);
    const diagnostics = engine.runDiagnostics();
    assert.equal(diagnostics.missionId, "Q13-05");
    assert.equal(diagnostics.q1305PrerequisitePresent, true);
    assert.equal(isForbiddenMissionId("Q13-05"), false);
    assert.equal(isForbiddenMissionId("Q13-06"), true);
    assert.equal(isForbiddenMissionId("Q14-01"), true);
  });
});
