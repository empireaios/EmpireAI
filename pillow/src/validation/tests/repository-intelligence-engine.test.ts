import assert from "node:assert/strict";
import { join } from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  RIENG_CAPABILITIES,
  RIENG_METADATA_VERSION,
  REPOSITORY_INTELLIGENCE_ENGINE_REPORT_VERSION,
  buildRepositoryIntelligenceEngineConfiguration,
  createRepositoryIntelligenceEngine,
  isForbiddenMissionId,
  resetRepositoryIntelligenceEngineForTesting,
  type RiengInput,
  type RepositoryIntelligenceEngineDependencies,
} from "../../repository-intelligence-engine/index.js";

const REPO_ROOT = join(import.meta.dirname, "..", "..", "..", "..");
const SCAN_ROOT = "pillow/src/repository-intelligence-engine";

function sampleInput(overrides: Partial<RiengInput> = {}): RiengInput {
  return {
    missionId: "Q13-02",
    pillowCommandConfirmed: true,
    validated: true,
    ...overrides,
  };
}

function isengStub() {
  return {
    getQ1302ConsumableContract: () => ({
      contractVersion: "ISENG-001-v1",
      consumerMissionId: "Q13-02",
      exposedFields: ["specifications", "architectureSummary"],
      neverImplementQ1302OrLater: true,
      specificationPrerequisite: true,
    }),
    getState: () => ({ missionId: "Q13-01" }),
  };
}

function aifrtStub() {
  return {
    getQ1301ConsumableContract: () => ({
      contractVersion: "AIFRT-001-v1",
      consumerMissionId: "Q13-01",
      exposedFields: ["technologySummary", "proposals"],
      neverImplementQ1301OrLater: true,
    }),
    getState: () => ({ status: "active" }),
  };
}

function riengDeps(overrides: Partial<RepositoryIntelligenceEngineDependencies> = {}): RepositoryIntelligenceEngineDependencies {
  return {
    implementationSpecificationEngine: isengStub(),
    aiInnovationFactory: aifrtStub(),
    pillowOrchestrationRuntime: {
      getTopology: () => ({ workflows: [{ id: "wf-01" }] }),
      getState: () => ({ status: "active" }),
    },
    auditRuntime: { getState: () => ({ status: "active" }) },
    executiveReportingRuntime: {
      submitWorkerReport: () => ({ records: [{ reportId: "ert-rieng-test" }] }),
    },
    ...overrides,
  };
}

async function build(deps?: RepositoryIntelligenceEngineDependencies) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  if (bootstrap.status !== "ready") {
    throw new Error("Bootstrap failed to reach ready state for Repository Intelligence Engine tests");
  }
  const engine = createRepositoryIntelligenceEngine(bootstrap, {
    dependencies: deps,
    configuration: {
      includeRoots: [SCAN_ROOT],
      maxFiles: 500,
      maxDepth: 8,
    },
  });
  await engine.initialize();
  engine.connect();
  return engine;
}

describe("Q13-02 Repository Intelligence Engine", () => {
  beforeEach(resetRepositoryIntelligenceEngineForTesting);

  test("1 locks boundaries (neverModifyAnalyzedFiles, neverImplementQ1303OrLater, neverBypassGovernance, etc.)", () => {
    const c = buildRepositoryIntelligenceEngineConfiguration(REPO_ROOT, {
      neverModifyAnalyzedFiles: false as never,
      neverImplementQ1303OrLater: false as never,
      neverCertifyQ1301: false as never,
    });
    assert.equal(c.neverModifyAnalyzedFiles, true);
    assert.equal(c.neverImplementQ1303OrLater, true);
    assert.equal(c.neverCertifyQ1301, true);
    assert.equal(c.readOnlyRepositoryAnalysis, true);
    assert.equal(c.deterministicRepositoryAnalysis, true);
    assert.equal(c.evidenceBasedOnly, true);
    assert.equal(c.preserveRepositoryKnowledgeHistory, true);
  });

  test("2 initializes PILLOW-RIENG-001 Q13-02", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q13-02");
    assert.equal(state.engineVersion, "PILLOW-RIENG-001");
    assert.equal(state.configuration.workerId, "wkr-repository-intelligence-engine-01");
    assert.equal(state.configuration.factory, "repository-intelligence-engine");
    assert.ok(RIENG_CAPABILITIES.includes("discover_repository_structure"));
    assert.ok(RIENG_CAPABILITIES.includes("consume_q1302_contract"));
    assert.ok(RIENG_CAPABILITIES.includes("expose_q1303_consumable_contract"));
    assert.ok(RIENG_CAPABILITIES.includes("never_modify_analyzed_files"));
  });

  test("3 discover repository structure (read-only; files found)", async () => {
    const engine = await build(riengDeps());
    const discovery = engine.discoverRepositoryStructure();
    assert.equal(discovery.readOnly, true);
    assert.ok(discovery.totalFiles >= 1);
    assert.ok(discovery.files.length >= 1);
    assert.ok(discovery.repositoryFingerprint.length > 0);
    assert.deepEqual(discovery.includeRoots, [SCAN_ROOT]);
  });

  test("4 analyse modules and services", async () => {
    const engine = await build(riengDeps());
    engine.discoverRepositoryStructure();
    const analysis = engine.analyzeModulesAndServices();
    assert.ok(analysis.moduleInventory.length >= 1);
    assert.ok(analysis.serviceInventory.length >= 1);
    assert.ok(analysis.moduleInventory.some((m) => m.path.includes("repository-intelligence-engine")));
  });

  test("5 build dependency graph", async () => {
    const engine = await build(riengDeps());
    engine.discoverRepositoryStructure();
    const graph = engine.buildDependencyGraph();
    assert.ok(graph.nodes.length >= 1);
    assert.ok(graph.edges.length >= 0);
    assert.ok(graph.computedAt);
  });

  test("6 detect existing implementations + architectural boundaries", async () => {
    const engine = await build(riengDeps());
    engine.discoverRepositoryStructure();
    const implementations = engine.detectExistingImplementations();
    const boundaries = engine.discoverArchitecturalBoundaries();
    assert.ok(Array.isArray(implementations));
    assert.ok(boundaries.length >= 1);
    assert.ok(boundaries.some((layer) => layer.layer === "pillow"));
  });

  test("7 identify reusable components + conflicts", async () => {
    const engine = await build(riengDeps());
    engine.discoverRepositoryStructure();
    const reusable = engine.identifyReusableComponents();
    const conflicts = engine.detectConflictsAndDuplicates();
    assert.ok(Array.isArray(reusable));
    assert.ok(Array.isArray(conflicts));
  });

  test("8 full Repository Intelligence Report + consumableByQ1303", async () => {
    const engine = await build(riengDeps());
    const report = await engine.produceReport(sampleInput());
    assert.equal(report.q1302ContractConsumed.consumed, true);
    assert.equal(report.consumableByQ1303, true);
    assert.equal(report.neverImplementQ1303OrLater, true);
    assert.equal(report.neverModifyAnalyzedFiles, true);
    assert.equal(report.metadataVersion, RIENG_METADATA_VERSION);
    assert.equal(report.reportVersion, REPOSITORY_INTELLIGENCE_ENGINE_REPORT_VERSION);
    assert.ok(report.repositorySummary.totalModules >= 1);
    assert.ok(report.moduleSummary.totalModules >= 1);
    assert.ok(report.dependencySummary.nodeCount >= 1);
    assert.ok(report.snapshot.repositorySnapshotId);
    assert.notEqual(report.validation.decision, "fail");
    assert.ok(report.confidenceScore > 0);
  });

  test("9 consume Q1302 from ISENG stub; never claim Q13-03 implemented", async () => {
    const engine = await build(riengDeps());
    const report = await engine.produceReport(sampleInput());
    assert.equal(report.q1302ContractConsumed.consumed, true);
    assert.ok(report.q1302ContractConsumed.fields.length > 0);
    assert.equal(report.q1302Prerequisite.implementationSpecificationEnginePresent, true);
    const serialized = JSON.stringify(report).toLowerCase();
    assert.ok(!serialized.includes("q13-03 implemented"));
    assert.ok(!serialized.includes("implementation planning engine implemented"));
  });

  test("10 Q1303 contract without implementing Q13-03", async () => {
    const engine = await build(riengDeps());
    const contract = engine.getQ1303ConsumableContract();
    assert.equal(contract.producedBy, "repository-intelligence-engine");
    assert.equal(contract.missionId, "Q13-02");
    assert.equal(contract.consumerMissionId, "Q13-03");
    assert.equal(contract.neverImplementQ1303OrLater, true);
    assert.equal(contract.structuralSignalOnly, true);
    assert.ok(contract.exposedFields.length > 0);
    assert.ok(!JSON.stringify(contract).toLowerCase().includes("q13-03 implemented"));
  });

  test("11 reject modifyRepository / implementQ1303OrLater / bypass governance", async () => {
    const engine = await build(riengDeps());
    for (const forbidden of [
      { modifyRepository: true },
      { implementQ1303OrLater: true },
      { certifyQ1301: true },
      { missionId: "Q13-03" },
      { missionId: "Q14-01" },
    ] as Partial<RiengInput>[]) {
      const report = await engine.produceReport({ ...sampleInput(), ...forbidden });
      assert.equal(report.validation.decision, "fail");
      assert.ok(report.validation.errors.length >= 1);
    }
    assert.equal(isForbiddenMissionId("Q13-02"), false);
    assert.equal(isForbiddenMissionId("Q13-03"), true);
    assert.equal(isForbiddenMissionId("Q14-01"), true);
  });

  test("12 reject Q13-03+; cockpit + knowledge history", async () => {
    const engine = await build(riengDeps());
    await engine.produceReport(sampleInput());
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q13-02");
    assert.equal(cockpit.neverModifyAnalyzedFiles, true);
    assert.equal(cockpit.neverImplementQ1303OrLater, true);
    assert.equal(cockpit.neverCertifyQ1301, true);
    assert.ok(cockpit.totalReports >= 1);
    const history = engine.getRepositoryKnowledgeHistory();
    assert.ok(history.length >= 1);
    const diagnostics = engine.runDiagnostics();
    assert.equal(diagnostics.missionId, "Q13-02");
    assert.equal(diagnostics.q1302PrerequisitePresent, true);
  });
});
