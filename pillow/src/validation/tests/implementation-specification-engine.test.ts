import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import { FACTORY_KEYS } from "../../shared-runtime-core/paths.js";
import {
  ISENG_CAPABILITIES,
  ISENG_METADATA_VERSION,
  IMPLEMENTATION_SPECIFICATION_REPORT_VERSION,
  buildImplementationSpecificationEngineConfiguration,
  createImplementationSpecificationEngine,
  isForbiddenMissionId,
  resetImplementationSpecificationEngineForTesting,
  type IsengInput,
  type ImplementationSpecificationEngineDependencies,
} from "../../implementation-specification-engine/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

function sampleInput(overrides: Partial<IsengInput> = {}): IsengInput {
  return {
    missionId: "Q13-01",
    missionName: "Implementation Specification Engine",
    programme: "Q-Series",
    pillowCommandConfirmed: true,
    validated: true,
    ...overrides,
  };
}

function aifrtStub() {
  return {
    getLatestReport: () => ({ confidenceScore: 0.75, seriesCompleteActivation: false }),
    getState: () => ({ latestReport: { confidenceScore: 0.75 } }),
    getQ1301ConsumableContract: () => ({
      contractVersion: "AIFRT-001-v1",
      consumerMissionId: "Q13-01",
      exposedFields: ["technologySummary", "proposals", "confidenceScore"],
      innovationPrerequisite: true,
      neverImplementQ1301OrLater: true,
    }),
  };
}

function qscptStub() {
  return {
    getLatestReport: () => ({ reportId: "qscpt-rpt-01", finalCompletionDecision: "complete" }),
    getState: () => ({ latestReport: { finalCompletionDecision: "complete" } }),
  };
}

function isengDeps(overrides: Partial<ImplementationSpecificationEngineDependencies> = {}): ImplementationSpecificationEngineDependencies {
  return {
    aiInnovationFactory: aifrtStub(),
    qSeriesCompletion: qscptStub(),
    sharedRuntimeCore: {
      listFactories: () => FACTORY_KEYS.slice(0, 2).map((factoryKey) => ({ factoryKey, status: "active" })),
      getState: () => ({ status: "active" }),
    },
    workerRegistry: {
      listWorkers: () => [{ workerId: "wkr-test-01", status: "active" }],
    },
    pillowOrchestrationRuntime: {
      getTopology: () => ({ workflows: [{ id: "wf-01" }] }),
      getState: () => ({ status: "active" }),
    },
    auditRuntime: { getState: () => ({ status: "active" }) },
    executiveReportingRuntime: {
      submitWorkerReport: () => ({ records: [{ reportId: "ert-iseng-test" }] }),
    },
    ...overrides,
  };
}

async function build(deps?: ImplementationSpecificationEngineDependencies) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  if (bootstrap.status !== "ready") {
    throw new Error("Bootstrap failed to reach ready state for Implementation Specification Engine tests");
  }
  const engine = createImplementationSpecificationEngine(bootstrap, { dependencies: deps });
  await engine.initialize();
  engine.connect();
  return engine;
}

describe("Q13-01 Implementation Specification Engine", () => {
  beforeEach(resetImplementationSpecificationEngineForTesting);

  test("1 locks mandatory boundaries", () => {
    const c = buildImplementationSpecificationEngineConfiguration(REPO_ROOT, {
      neverFabricateRepositoryState: false as never,
      neverOverwriteVerifiedImplementations: false as never,
      neverExecuteImplementations: false as never,
      neverAutoDeploy: false as never,
      neverBypassGovernance: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverImplementQ1302OrLater: false as never,
    });
    assert.equal(c.neverFabricateRepositoryState, true);
    assert.equal(c.neverOverwriteVerifiedImplementations, true);
    assert.equal(c.neverExecuteImplementations, true);
    assert.equal(c.neverAutoDeploy, true);
    assert.equal(c.neverBypassGovernance, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ1302OrLater, true);
    assert.equal(c.preserveCompleteTraceability, true);
    assert.equal(c.preserveSpecificationHistory, true);
    assert.equal(c.evidenceBasedOnly, true);
  });

  test("2 initializes PILLOW-ISENG-001 Q13-01", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q13-01");
    assert.equal(state.engineVersion, "PILLOW-ISENG-001");
    assert.equal(state.configuration.workerId, "wkr-implementation-specification-engine-01");
    assert.equal(state.configuration.factory, "implementation-specification-engine");
    assert.ok(ISENG_CAPABILITIES.includes("parse_approved_roadmap_mission"));
    assert.ok(ISENG_CAPABILITIES.includes("consume_q1301_consumable_contract"));
    assert.ok(ISENG_CAPABILITIES.includes("expose_q1302_consumable_contract"));
    assert.ok(ISENG_CAPABILITIES.includes("never_execute_implementations"));
  });

  test("3 parse approved roadmap mission from evidence/input", async () => {
    const engine = await build(isengDeps());
    const mission = engine.parseApprovedRoadmapMission(sampleInput());
    assert.equal(mission.missionId, "Q13-01");
    assert.equal(mission.missionName, "Implementation Specification Engine");
    assert.equal(mission.programme, "Q-Series");
    assert.ok(mission.evidence.some((e) => e.includes("explicit_input:missionId")));
  });

  test("4 analyse repository architecture read-only", async () => {
    const engine = await build(isengDeps());
    const architecture = engine.analyseRepositoryArchitecture(sampleInput());
    assert.ok(architecture.scannedRoots.length >= 1);
    assert.ok(architecture.moduleCount >= 1);
    assert.ok(architecture.evidence.some((e) => e.includes("never_fabricate_repository_state")));
    assert.ok(architecture.sharedRuntimeFactories >= 1);
  });

  test("5 discover dependencies", async () => {
    const engine = await build(isengDeps());
    engine.parseApprovedRoadmapMission(sampleInput());
    engine.analyseRepositoryArchitecture(sampleInput());
    const deps = engine.discoverImplementationDependencies(sampleInput());
    assert.ok(deps.dependencies.some((d) => d.dependency.includes("aiInnovationFactory")));
    assert.ok(deps.injectedHandles.includes("aiInnovationFactory"));
    assert.ok(deps.evidence.some((e) => e.includes("dependency_count")));
  });

  test("6 detect existing implementations to preserve", async () => {
    const engine = await build(isengDeps());
    engine.parseApprovedRoadmapMission(sampleInput());
    engine.analyseRepositoryArchitecture(sampleInput());
    const preservation = engine.detectExistingImplementationsToPreserve(sampleInput());
    assert.equal(preservation.neverOverwrite, true);
    assert.ok(preservation.preservedImplementations.length >= 1);
    assert.ok(preservation.evidence.some((e) => e.includes("neverOverwriteVerifiedImplementations")));
  });

  test("7 generate complete implementation specification", async () => {
    const engine = await build(isengDeps());
    engine.parseApprovedRoadmapMission(sampleInput());
    engine.analyseRepositoryArchitecture(sampleInput());
    const spec = engine.generateImplementationSpecification(sampleInput());
    assert.ok(spec.specificationId.startsWith("iseng-spec-"));
    assert.equal(spec.missionId, "Q13-01");
    assert.ok(spec.repositoryFindings.length >= 1);
    assert.ok(spec.dependencies.length >= 1);
    assert.ok(spec.architectureSummary.length > 0);
    assert.ok(spec.filesExpected.length >= 1);
    assert.ok(spec.requiredCapabilities.length >= 1);
    assert.ok(spec.validationPlan.length >= 1);
    assert.ok(spec.integrationPlan.length >= 1);
    assert.ok(spec.risks.length >= 1);
    assert.ok(spec.constraints.length >= 1);
    assert.ok(spec.governanceRequirements.length >= 1);
    assert.equal(spec.version, ISENG_METADATA_VERSION);
    assert.ok(spec.timestamp);
  });

  test("8 full Specification Report + consumableByQ1302", async () => {
    const engine = await build(isengDeps());
    const report = await engine.produceReport(sampleInput());
    assert.equal(report.q1301ContractConsumed.consumed, true);
    assert.equal(report.consumableByQ1302, true);
    assert.equal(report.neverImplementQ1302OrLater, true);
    assert.equal(report.neverExecuteImplementations, true);
    assert.ok(report.specifications.length >= 1);
    assert.ok(report.missionSummary.missionId === "Q13-01");
    assert.ok(report.repositoryAuditSummary.moduleCount >= 1);
    assert.ok(report.dependencySummary.dependencies.length >= 1);
    assert.ok(report.preservationSummary.preservedImplementations.length >= 1);
    assert.notEqual(report.validation.decision, "fail");
    assert.ok(report.confidenceScore > 0);
  });

  test("9 consume Q1301; never claim Q13-02 implemented", async () => {
    const engine = await build(isengDeps());
    const report = await engine.produceReport(sampleInput());
    assert.equal(report.q1301ContractConsumed.consumed, true);
    assert.ok(report.q1301ContractConsumed.fields.length > 0);
    const serialized = JSON.stringify(report).toLowerCase();
    assert.ok(!serialized.includes("q13-02 implemented"));
    assert.ok(!serialized.includes("repository intelligence engine implemented"));
  });

  test("10 Q1302 contract without implementing Repository Intelligence Engine / Q13-02", async () => {
    const engine = await build(isengDeps());
    const contract = engine.getQ1302ConsumableContract();
    assert.equal(contract.producedBy, "implementation-specification-engine");
    assert.equal(contract.missionId, "Q13-01");
    assert.equal(contract.consumerMissionId, "Q13-02");
    assert.equal(contract.specificationPrerequisite, true);
    assert.equal(contract.neverImplementQ1302OrLater, true);
    assert.ok(contract.exposedFields.length > 0);
    assert.ok(!JSON.stringify(contract).toLowerCase().includes("q13-02 implemented"));
  });

  test("11 reject fabricate overwrite execute bypass governance", async () => {
    const engine = await build(isengDeps());
    for (const forbidden of [
      { fabricateRepositoryState: true },
      { overwriteVerifiedImplementations: true },
      { executeImplementation: true },
      { autoDeploy: true },
      { bypassGovernance: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { implementQ1302OrLater: true },
    ] as const) {
      const report = await engine.produceReport({ ...sampleInput(), ...forbidden });
      assert.equal(report.validation.decision, "fail", `expected fail for ${JSON.stringify(forbidden)}`);
      assert.equal(report.consumableByQ1302, false);
    }
  });

  test("12 rejects Q13-02+; cockpit + history", async () => {
    const engine = await build(isengDeps());
    assert.equal(isForbiddenMissionId("Q13-01"), false);
    for (const missionId of ["Q13-02", "Q13-03", "Q14-01"]) {
      assert.equal(isForbiddenMissionId(missionId), true, `expected forbidden: ${missionId}`);
      const report = await engine.produceReport({ ...sampleInput(), missionId });
      assert.equal(report.validation.decision, "fail", `expected fail for ${missionId}`);
    }

    await engine.produceReport(sampleInput());
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q13-01");
    assert.equal(cockpit.neverExecuteImplementations, true);
    assert.equal(cockpit.neverImplementQ1302OrLater, true);

    const history = engine.getSpecificationHistory();
    assert.ok(history.length >= 1);

    const diagnostics = engine.runDiagnostics();
    assert.equal(diagnostics.missionId, "Q13-01");
    assert.ok(engine.getAuditTrail().length >= 1);
    assert.ok(engine.getCatalog());
    assert.ok(engine.getReports().length >= 1);
    assert.equal((await engine.produceReport(sampleInput())).metadataVersion, ISENG_METADATA_VERSION);
    assert.equal((await engine.produceReport(sampleInput())).reportVersion, IMPLEMENTATION_SPECIFICATION_REPORT_VERSION);

    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 0);
  });
});
