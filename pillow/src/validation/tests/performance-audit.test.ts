import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  AUDIT_STATUSES,
  CHECK_STATUSES,
  PERFORMANCE_COMPONENT_KEYS,
  READINESS_CLASSIFICATIONS,
  READINESS_DECISIONS,
  PERFART_CAPABILITIES,
  PERFART_METADATA_VERSION,
  PERFORMANCE_AUDIT_REPORT_VERSION,
  buildPerformanceAuditConfiguration,
  createPerformanceAudit,
  isForbiddenMissionId,
  resetPerformanceAuditForTesting,
  type PerfartInput,
  type PerformanceAuditDependencies,
} from "../../performance-audit/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

function sampleInput(overrides: Partial<PerfartInput> = {}): PerfartInput {
  return {
    grandKingInstructions:
      "Discover every performance benchmark target strictly from injected handles, execute real timed structural probes, measure response time/throughput/resource utilisation/scalability/sustained stability from observed evidence only, and classify performance readiness deterministically; never fabricate timings, never certify untested performance, never optimize or modify production systems, never override governance, Pillow, or Grand King.",
    pillowCommandConfirmed: true,
    grandKingApproved: true,
    validated: true,
    ...overrides,
  };
}

/** Full evidence stubs: every catalogued performance component bound with its safe structural probe method present. */
function allDependenciesReachable(): PerformanceAuditDependencies {
  const deps: Record<string, unknown> = {};
  deps.workerRegistry = {
    getState: () => ({ status: "active" }),
    listWorkers: () => [{ workerId: "wkr-1" }, { workerId: "wkr-2" }],
    registerWorker: () => ({ ok: true }),
  };
  deps.sharedRuntimeCore = {
    getState: () => ({ status: "active" }),
    getCatalog: () => ({ factories: [] }),
  };
  deps.monitoringRuntime = {
    getState: () => ({ status: "active" }),
    getDashboard: () => ({ panels: [] }),
  };
  deps.apiRuntime = {
    getState: () => ({ status: "active" }),
    checkHealth: () => ({ status: "active" }),
  };
  deps.queueRuntime = {
    getState: () => ({ status: "active", metrics: { depth: 0 } }),
  };
  deps.schedulingRuntime = {
    getState: () => ({ status: "active" }),
  };
  deps.auditRuntime = {
    getState: () => ({ status: "active" }),
    query: () => [],
  };
  deps.executiveReportingRuntime = {
    getState: () => ({ status: "active" }),
    submitWorkerReport: () => ({ records: [{ reportId: "ert-perfart-test" }] }),
    retrieveReport: () => ({ report: {} }),
  };
  deps.productionCertificationCore = {
    getState: () => ({ status: "active" }),
    getCertificationResults: () => [],
  };
  deps.pillowOrchestrationRuntime = {
    getState: () => ({ status: "active" }),
    invokeWorker: () => ({ dispatched: true }),
    invokeWorkflow: () => ({ dispatched: true }),
    retrieveReport: () => ({ report: {} }),
  };
  deps.securityAudit = {
    getState: () => ({ status: "active" }),
    getQ1106ConsumableContract: () => ({
      contractVersion: "SECART-001-v1",
      consumerMissionId: "Q11-06",
      exposedFields: ["assessments", "securityReadinessSummary"],
    }),
  };
  return deps as PerformanceAuditDependencies;
}

async function build(config?: Parameters<typeof createPerformanceAudit>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  if (bootstrap.status !== "ready") {
    throw new Error("Bootstrap failed to reach ready state for Performance Audit tests");
  }
  const engine = createPerformanceAudit(bootstrap, config);
  await engine.initialize();
  engine.connect();
  return engine;
}

async function buildFullyReachable() {
  return build({ dependencies: allDependenciesReachable() });
}

describe("Q11-06 Performance Audit", () => {
  beforeEach(resetPerformanceAuditForTesting);

  test("1 locks mandatory boundaries", () => {
    const c = buildPerformanceAuditConfiguration(REPO_ROOT, {
      neverFabricatePerformanceEvidence: false as never,
      neverCertifyUntestedPerformance: false as never,
      neverOptimizeOrModifyProductionSystems: false as never,
      neverAssumeImplementation: false as never,
      neverModifyPerformanceImplementations: false as never,
      neverRepairFailedPerformanceComponents: false as never,
      neverBypassPillowGovernance: false as never,
      neverBypassGrandKingApproval: false as never,
      neverOverrideApprovedArchitecture: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverImplementQ1107OrLater: false as never,
    });
    assert.equal(c.neverFabricatePerformanceEvidence, true);
    assert.equal(c.neverCertifyUntestedPerformance, true);
    assert.equal(c.neverOptimizeOrModifyProductionSystems, true);
    assert.equal(c.neverAssumeImplementation, true);
    assert.equal(c.neverModifyPerformanceImplementations, true);
    assert.equal(c.neverRepairFailedPerformanceComponents, true);
    assert.equal(c.neverBypassPillowGovernance, true);
    assert.equal(c.neverBypassGrandKingApproval, true);
    assert.equal(c.neverOverrideApprovedArchitecture, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ1107OrLater, true);
    assert.equal(c.preserveCompleteTraceability, true);
    assert.equal(c.preserveImmutableBenchmarkHistory, true);
    assert.equal(c.preserveAuditHistory, true);
    assert.equal(c.deterministicAuditBehaviour, true);
    assert.equal(c.structuralSignalOnly, true);
    assert.equal(c.evidenceBasedOnly, true);
    assert.equal(c.maskSensitiveValues, true);
  });

  test("2 initializes PILLOW-PERFART-001 Q11-06", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q11-06");
    assert.equal(state.engineVersion, "PILLOW-PERFART-001");
    assert.equal(state.configuration.workerId, "wkr-performance-audit-01");
    assert.equal(state.configuration.factory, "performance-audit");
    assert.ok(PERFART_CAPABILITIES.includes("discover_performance_components"));
    assert.ok(PERFART_CAPABILITIES.includes("execute_workload_benchmarks"));
    assert.ok(PERFART_CAPABILITIES.includes("measure_throughput"));
    assert.ok(PERFART_CAPABILITIES.includes("classify_performance_readiness"));
    assert.ok(PERFART_CAPABILITIES.includes("expose_q1107_consumable_contract"));
    assert.ok(PERFART_CAPABILITIES.includes("consume_q1106_consumable_contract"));
    for (const classification of READINESS_CLASSIFICATIONS) {
      assert.ok(
        ["certified", "partially_certified", "failed", "missing", "blocked", "deferred"].includes(classification),
      );
    }
    for (const decision of READINESS_DECISIONS) {
      assert.ok(["certify", "withhold", "escalate", "defer"].includes(decision));
    }
    for (const status of CHECK_STATUSES) {
      assert.ok(["Passed", "Partial", "Failed", "Missing"].includes(status));
    }
  });

  test("3 discovers performance components strictly from injected handles", async () => {
    const engineNoHandles = await build();
    const noHandleDiscovery = engineNoHandles.discoverPerformanceComponents();
    assert.equal(noHandleDiscovery.discoveredCount, 0);
    assert.equal(noHandleDiscovery.totalCatalogued, PERFORMANCE_COMPONENT_KEYS.length);

    const engine = await buildFullyReachable();
    const discovery = engine.discoverPerformanceComponents();
    assert.equal(discovery.discoveredCount, PERFORMANCE_COMPONENT_KEYS.length);
    for (const component of discovery.components) {
      assert.ok((PERFORMANCE_COMPONENT_KEYS as readonly string[]).includes(component.componentKey));
      assert.equal(component.bound, true);
      assert.equal(component.evidencePresent, true);
    }
  });

  test("4 executes workload benchmarks with real measured timings", async () => {
    const engine = await buildFullyReachable();
    const rows = engine.executeWorkloadBenchmarks();
    assert.equal(rows.length, PERFORMANCE_COMPONENT_KEYS.length);
    for (const row of rows) {
      assert.equal(row.bound, true);
      assert.equal(row.errorRate, 0);
      assert.ok(typeof row.responseTime === "number");
      assert.ok(row.responseTime! >= 0);
    }

    const bareEngine = await build();
    const bareRows = bareEngine.executeWorkloadBenchmarks();
    for (const row of bareRows) {
      assert.equal(row.bound, false);
      assert.equal(row.responseTime, null);
      assert.equal(row.errorRate, 1);
    }
  });

  test("5 measures response times, throughput, and resource utilisation", async () => {
    const engine = await buildFullyReachable();
    const responseRows = engine.measureResponseTimes();
    assert.equal(responseRows.length, PERFORMANCE_COMPONENT_KEYS.length);
    for (const row of responseRows) {
      assert.ok(typeof row.responseTime === "number");
    }

    const throughputRows = await engine.measureThroughput();
    assert.equal(throughputRows.length, PERFORMANCE_COMPONENT_KEYS.length);
    for (const row of throughputRows) {
      assert.ok(typeof row.throughput === "number");
      assert.ok(row.throughput! > 0);
    }

    const resource = await engine.measureResourceUtilisation();
    assert.ok(resource.heapUsedMb > 0);
    assert.ok(resource.heapTotalMb > 0);
    assert.ok(resource.rssMb > 0);
    assert.ok(Array.isArray(resource.evidence));

    const scalability = await engine.measureScalability();
    assert.equal(scalability.length, PERFORMANCE_COMPONENT_KEYS.length);
    for (const row of scalability) {
      assert.ok(row.successCount > 0);
      assert.equal(row.failureCount, 0);
    }
  });

  test("6 detects bottlenecks deterministically from measured evidence", async () => {
    const engine = await buildFullyReachable();
    const bottlenecks = await engine.detectBottlenecks();
    assert.equal(bottlenecks.totalBottlenecks, 0);
    assert.equal(bottlenecks.rows.length, 0);

    const bareEngine = await build();
    const bareBottlenecks = await bareEngine.detectBottlenecks();
    assert.equal(bareBottlenecks.totalBottlenecks, PERFORMANCE_COMPONENT_KEYS.length);
    for (const row of bareBottlenecks.rows) {
      assert.equal(row.stabilityStatus, "Missing");
      assert.ok(row.reason.includes("not bound"));
    }
  });

  test("7 verifies sustained stability via repeated probes", async () => {
    const engine = await buildFullyReachable();
    const rows = engine.verifySustainedStability();
    assert.equal(rows.length, PERFORMANCE_COMPONENT_KEYS.length);
    for (const row of rows) {
      assert.equal(row.stabilityStatus, "Passed");
      assert.equal(row.stabilityLabel, "stable");
      assert.ok(row.samples.length > 0);
      assert.ok(typeof row.meanMs === "number");
    }

    const bareEngine = await build();
    const bareRows = bareEngine.verifySustainedStability();
    for (const row of bareRows) {
      assert.equal(row.stabilityStatus, "Missing");
      assert.equal(row.stabilityLabel, "unknown");
    }
  });

  test("8 performance readiness classifications + full Performance Audit Report + consumableByQ1107", async () => {
    const engine = await buildFullyReachable();
    const report = await engine.produceReport(sampleInput());
    assert.ok(["pass", "partial"].includes(report.validation.decision));
    assert.ok(report.reportId.startsWith("perfart-rpt-"));
    assert.ok(report.timestamp);
    assert.equal(report.auditVersion, "Q11-PERFART-v1");
    assert.equal(report.engineId, "PILLOW-PERFART-001");
    assert.equal(report.missionId, "Q11-06");
    assert.equal(report.totalPerformanceComponents, PERFORMANCE_COMPONENT_KEYS.length);
    assert.equal(
      report.certifiedComponents +
        report.partiallyCertifiedComponents +
        report.failedComponents +
        report.missingComponents +
        report.blockedComponents +
        report.deferredComponents,
      PERFORMANCE_COMPONENT_KEYS.length,
    );
    assert.ok(report.benchmarkSummary);
    assert.ok(report.workerPerformanceSummary);
    assert.ok(report.factoryPerformanceSummary);
    assert.ok(report.runtimePerformanceSummary);
    assert.ok(report.apiPerformanceSummary);
    assert.ok(report.bottleneckSummary);
    assert.ok(report.resourceUtilisationSummary);
    assert.ok(report.sustainedStabilitySummary);
    assert.ok(report.integrationSummary);
    assert.ok(report.governanceSummary);
    assert.ok(Array.isArray(report.supportingEvidence));
    assert.ok(Array.isArray(report.outstandingIssues));
    assert.ok(report.confidenceScore >= 0 && report.confidenceScore <= 1);
    assert.equal(report.metadataVersion, PERFART_METADATA_VERSION);
    assert.equal(report.reportVersion, PERFORMANCE_AUDIT_REPORT_VERSION);
    assert.equal(report.workerId, "wkr-performance-audit-01");
    assert.ok(READINESS_DECISIONS.includes(report.decision));
    assert.equal(report.decision, "certify");
    assert.equal(report.certifiedComponents, PERFORMANCE_COMPONENT_KEYS.length);
    assert.ok(report.validation);
    assert.equal(report.consumableByQ1107, true);
    assert.equal(report.neverImplementQ1107OrLater, true);
    assert.equal(report.structuralSignalOnly, true);
    assert.equal(report.evidenceBasedOnly, true);
    assert.equal(report.sixthQ11Gate, true);
    assert.ok(report.q1106ContractConsumed);
    assert.equal(report.q1106ContractConsumed.attempted, true);
    assert.equal(report.q1106ContractConsumed.consumed, true);
    assert.equal(report.componentInventory.length, PERFORMANCE_COMPONENT_KEYS.length);
    assert.equal(report.assessments.length, PERFORMANCE_COMPONENT_KEYS.length);
    for (const row of report.assessments) {
      assert.ok(row.componentId.length > 0);
      assert.ok(row.componentType.length > 0);
      assert.ok(row.benchmarkId.length > 0);
      assert.ok(row.testScenario.length > 0);
      assert.ok(CHECK_STATUSES.includes(row.stabilityStatus));
      assert.ok(READINESS_CLASSIFICATIONS.includes(row.performanceClassification));
      assert.ok(Array.isArray(row.supportingEvidence));
      assert.ok(row.auditReference.length > 0);
      assert.ok(row.auditTimestamp.length > 0);
      assert.ok(typeof row.responseTime === "number");
      assert.ok(typeof row.throughput === "number");
    }
    assert.ok(AUDIT_STATUSES.includes(report.auditStatus));
    assert.equal(report.auditStatus, "certified");
    const serialized = JSON.stringify(report).toLowerCase();
    assert.ok(!serialized.includes("recovery audit implemented"), "must never claim to implement Recovery Audit");
    assert.ok(!serialized.includes("password="), "must never expose password values in the report");
  });

  test("9 exposes Q1107 contract without implementing Recovery Audit", async () => {
    const engine = await buildFullyReachable();
    const contract = engine.getQ1107ConsumableContract();
    assert.equal(contract.producedBy, "performance-audit");
    assert.equal(contract.missionId, "Q11-06");
    assert.equal(contract.consumerMissionId, "Q11-07");
    assert.ok(contract.exposedFields.length > 0);
    assert.ok(contract.readinessClassificationCatalog.length > 0);
    assert.ok(contract.decisionCatalog.length > 0);
    assert.equal(contract.neverImplementQ1107OrLater, true);
    assert.equal(contract.structuralSignalOnly, true);
    assert.ok(
      !JSON.stringify(contract).toLowerCase().includes("recovery audit implemented"),
      "must never claim to implement Recovery Audit",
    );

    const report = await engine.produceReport(sampleInput());
    assert.equal(report.q1106ContractConsumed.attempted, true);
    assert.equal(report.q1106ContractConsumed.consumed, true);
  });

  test("10 rejects fabricate / certify-untested / optimize-production / governance bypass", async () => {
    const engine = await buildFullyReachable();
    for (const forbidden of [
      { fabricatePerformanceEvidence: true },
      { forceFail: true },
      { certifyUntestedPerformance: true },
      { optimizeOrModifyProductionSystems: true },
      { assumeImplementation: true },
      { modifyPerformanceImplementations: true },
      { repairFailedPerformanceComponents: true },
      { bypassPillowGovernance: true },
      { bypassGrandKingApproval: true },
      { overrideApprovedArchitecture: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { implementQ1107OrLater: true },
    ] as const) {
      const report = await engine.produceReport({
        ...sampleInput(),
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail", `expected fail for ${JSON.stringify(forbidden)}`);
      assert.equal(report.decision, "escalate");
    }
  });

  test("11 rejects Q11-07+ missionId", async () => {
    const engine = await buildFullyReachable();
    assert.equal(isForbiddenMissionId("Q11-06"), false);
    for (const missionId of ["Q11-07", "Q11-08", "Q12-01", "Q20-01"]) {
      assert.equal(isForbiddenMissionId(missionId), true, `expected forbidden: ${missionId}`);
      const report = await engine.produceReport({
        ...sampleInput(),
        missionId,
      });
      assert.equal(report.validation.decision, "fail", `expected fail for ${missionId}`);
      assert.equal(report.decision, "escalate");
    }
    const selfOk = await engine.produceReport({ ...sampleInput(), missionId: "Q11-06" });
    assert.notEqual(selfOk.decision, "escalate");
  });

  test("12 cockpit + never implements Q1107+ + consumes Q1106 when injected", async () => {
    const engine = await buildFullyReachable();
    await engine.produceReport(sampleInput());
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q11-06");
    assert.ok(cockpit.totalReports >= 1);
    assert.equal(cockpit.lastDecision, "certify");
    assert.equal(cockpit.workerId, "wkr-performance-audit-01");
    assert.deepEqual([...cockpit.readinessClassificationOptions].sort(), [...READINESS_CLASSIFICATIONS].sort());
    assert.equal(cockpit.neverFabricatePerformanceEvidence, true);
    assert.equal(cockpit.neverOptimizeOrModifyProductionSystems, true);
    assert.equal(cockpit.neverImplementQ1107OrLater, true);
    assert.equal(cockpit.sixthQ11Gate, true);

    const diagnostics = engine.runDiagnostics();
    assert.equal(diagnostics.missionId, "Q11-06");
    assert.ok(engine.getAuditTrail().length >= 1);
    assert.ok(engine.getCatalog());
    assert.ok(engine.getReports().length >= 1);
    assert.ok(engine.list().length >= 1);
    assert.ok(engine.getPerformanceMatrix().length > 0);
    assert.ok(engine.getBenchmarkHistory().length > 0);

    const sync = engine.validateForSupervisorSync();
    assert.notEqual(sync.health, "blocked");
    assert.ok(sync.readinessScore > 0);

    // No securityAudit injected -> Q1106 contract handshake not attempted.
    const bareEngine = await build();
    const bareReport = await bareEngine.produceReport(sampleInput());
    assert.equal(bareReport.q1106ContractConsumed.attempted, false);
    assert.equal(bareReport.q1106ContractConsumed.consumed, false);
  });
});
