import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  PERFORMANCE_EKLS_KINDS,
  PERFORMANCE_RESULT_STATES,
  PERFORMANCE_SCALABILITY_RESILIENCE_CERTIFICATION_VERSION,
  buildCockpitPerformanceView,
  createProductionCertificationModuleContract,
  getPerformanceOverview,
  listPerformanceEklsKinds,
  performanceCertificationTools,
  registerPerformancePlugin,
  resetProductionCertificationHarnessForTests,
  resolvePerformanceCertificationRules,
  runPerformanceScan,
  searchPerformanceEklsObservations,
  validateApiPerformance,
  validateDatabasePerformance,
  validateResilience,
  validateScalability,
  validatePerformancePillowGovernance,
} from "../../orchestration/production-certification/index.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

const TEST_CONTEXT = { workspaceId: "ws-foundation" } as const;
const TEST_ACTOR = {
  actorId: "grand-king",
  workspaceId: "ws-foundation",
  pillowGovernance: true as const,
};

function configurePerformanceTestEnvironment(): void {
  process.env.PERF_API_LATENCY_MS = "120";
  process.env.PERF_BRAIN_DISPATCH_MS = "80";
  process.env.PERF_DB_QUERY_MS = "40";
  process.env.PERF_QUEUE_THROUGHPUT = "500";
  process.env.PERF_REGISTRY_LOOKUP_MS = "10";
  process.env.PERF_PLUGIN_LOAD_MS = "150";
  process.env.PERF_COCKPIT_RESPONSE_MS = "180";
  process.env.PERF_WORKFLOW_THROUGHPUT = "120";
  process.env.PERF_MEMORY_USAGE_PERCENT = "55";
  process.env.PERF_CPU_USAGE_PERCENT = "45";
  process.env.PERF_RECOVERY_TIME_MS = "8000";
  process.env.PERF_HORIZONTAL_SCALE_READY = "true";
  process.env.PERF_RECOVERY_SUCCESS = "true";
  process.env.PERF_FAILOVER_READY = "true";
  process.env.PERF_API_SLOW = "false";
  process.env.PERF_BRAIN_SLOW = "false";
  process.env.PERF_QUEUE_CONGESTION = "false";
  process.env.PERF_DB_BOTTLENECK = "false";
  process.env.PERF_PLUGIN_BOTTLENECK = "false";
  process.env.PERF_MEMORY_LEAK = "false";
  process.env.PERF_RESOURCE_EXHAUSTION = "false";
  process.env.PERF_HIGH_LATENCY = "false";
  process.env.PERF_POOR_RECOVERY = "false";
  process.env.PERF_FAILOVER_FAILED = "false";
  process.env.PERF_SCALABILITY_LIMIT = "false";
}

describe("G6-06 — Performance, Scalability & Resilience Certification", () => {
  it("exposes performance certification version and result states", () => {
    assert.equal(PERFORMANCE_SCALABILITY_RESILIENCE_CERTIFICATION_VERSION, "g6-06-v1");
    assert.ok(PERFORMANCE_RESULT_STATES.includes("pass"));
    assert.ok(PERFORMANCE_RESULT_STATES.includes("fail"));
    assert.equal(PERFORMANCE_RESULT_STATES.length, 5);
  });

  it("retains G6-06 performance subsystem after G6-10 module advance", () => {
    const contract = createProductionCertificationModuleContract();
    assert.equal(contract.missionId, "G6-10");
    assert.equal(contract.programmeStatus, "production-readiness-certified");
    assert.ok(contract.capabilities.includes("production-certification.performance_scan"));
  });

  it("resolves performance rules from REG-CERTIFICATION-PERFORMANCE", () => {
    resetProductionCertificationHarnessForTests();
    configurePerformanceTestEnvironment();
    const rules = resolvePerformanceCertificationRules(TEST_CONTEXT);
    assert.ok(rules.length >= 15);
    assert.ok(rules.some((rule) => rule.ruleKind === "api_performance"));
    assert.ok(rules.some((rule) => rule.ruleKind === "database_performance"));
    assert.ok(rules.some((rule) => rule.targetLatencyMs !== undefined));
  });

  it("validates API, database, scalability and resilience via registry thresholds", () => {
    resetProductionCertificationHarnessForTests();
    configurePerformanceTestEnvironment();
    const rules = resolvePerformanceCertificationRules(TEST_CONTEXT);
    assert.equal(validateApiPerformance(rules, TEST_CONTEXT).bottlenecks.length, 0);
    assert.equal(validateDatabasePerformance(rules, TEST_CONTEXT).bottlenecks.length, 0);
    assert.equal(validateScalability(rules, TEST_CONTEXT).bottlenecks.length, 0);
    assert.equal(validateResilience(rules, TEST_CONTEXT).bottlenecks.length, 0);
  });

  it("executes benchmarks without exposing private benchmark data", () => {
    resetProductionCertificationHarnessForTests();
    configurePerformanceTestEnvironment();
    const scan = runPerformanceScan(TEST_ACTOR);
    assert.ok(scan.benchmarks.length >= 5);
    for (const benchmark of scan.benchmarks) {
      assert.equal(benchmark.summary.includes("secret"), false);
      assert.equal(benchmark.summary.includes("token"), false);
      assert.equal(benchmark.summary.includes("credential"), false);
    }
  });

  it("registers all required performance Brain tools", () => {
    const names = new Set(performanceCertificationTools.map((tool) => tool.name));
    for (const toolName of [
      "performance_overview",
      "performance_scan",
      "performance_score",
      "performance_bottlenecks",
      "performance_trends",
      "performance_recommendations",
      "performance_status",
    ]) {
      assert.equal(names.has(toolName), true, `Missing Brain tool: ${toolName}`);
    }
  });

  it("passes Pillow governance for performance operations", () => {
    resetProductionCertificationHarnessForTests();
    configurePerformanceTestEnvironment();
    const result = validatePerformancePillowGovernance({
      ...TEST_ACTOR,
      operation: "performance_scan",
    });
    assert.equal(result.allowed, true);
    assert.equal(result.performanceCertificationAuthority, true);
    assert.equal(result.benchmarkValidity, true);
    assert.equal(result.evidenceIntegrity, true);
  });

  it("runs performance scan and produces scalability and resilience status", () => {
    resetProductionCertificationHarnessForTests();
    configurePerformanceTestEnvironment();
    const scan = runPerformanceScan(TEST_ACTOR);
    assert.ok(scan.scanId);
    assert.ok(["pass", "pass_with_conditions", "warning"].includes(scan.status));
    assert.equal(scan.scalabilityStatus.horizontalScaleReady, true);
    assert.equal(scan.resilienceStatus.failoverReady, true);
    assert.equal(scan.discoverySource, "REG-CERTIFICATION-PERFORMANCE");

    const overview = getPerformanceOverview(TEST_CONTEXT);
    assert.equal(overview.lastScanId, scan.scanId);
  });

  it("records performance EKLS observations through Pillow", () => {
    resetProductionCertificationHarnessForTests();
    configurePerformanceTestEnvironment();
    assert.deepEqual(listPerformanceEklsKinds(), [...PERFORMANCE_EKLS_KINDS]);
    runPerformanceScan(TEST_ACTOR);

    const search = searchPerformanceEklsObservations({
      actorId: TEST_ACTOR.actorId,
      workspaceId: TEST_ACTOR.workspaceId,
      kind: "performance_scan_completed",
      pillowGovernance: true,
    });
    assert.ok(search.length >= 1);
  });

  it("exposes Cockpit performance backend contract", () => {
    resetProductionCertificationHarnessForTests();
    configurePerformanceTestEnvironment();
    const scan = runPerformanceScan(TEST_ACTOR);
    const overview = getPerformanceOverview(TEST_CONTEXT);
    const view = buildCockpitPerformanceView({ overview, scan });
    assert.equal(view.viewId, "cockpit-performance-scalability-resilience");
    assert.equal(view.certificationStatus, scan.status);
    assert.ok(view.recommendations.length >= 1);
  });

  it("supports performance validator plugins without modifying certification core", () => {
    resetProductionCertificationHarnessForTests();
    configurePerformanceTestEnvironment();
    const registered = registerPerformancePlugin({
      manifest: {
        pluginId: "test-performance-plugin",
        pluginName: "Test Performance Plugin",
        validatorKind: "performance",
        pillowGovernance: true,
      },
      hooks: {
        pluginId: "test-performance-plugin",
        validatorKind: "performance",
        validate: () => [],
      },
      ...TEST_ACTOR,
    });
    assert.equal(registered.accepted, true);
    runPerformanceScan(TEST_ACTOR);
  });

  it("runs performance scan via Brain tool handler", async () => {
    resetProductionCertificationHarnessForTests();
    configurePerformanceTestEnvironment();
    const tool = performanceCertificationTools.find((entry) => entry.name === "performance_scan");
    assert.ok(tool);
    const result = await tool!.handler(
      { workspaceId: TEST_ACTOR.workspaceId, actorId: TEST_ACTOR.actorId },
      { workspaceId: TEST_ACTOR.workspaceId, agentId: "test-agent", correlationId: "corr-g6-06" },
    );
    assert.ok((result as { scanId: string }).scanId);
  });

  it("runs certification probe for performance scan check", async () => {
    resetProductionCertificationHarnessForTests();
    configurePerformanceTestEnvironment();
    const { runCertificationCheck } = await import(
      "../../orchestration/production-certification/services/certification-runner-service.js"
    );
    const result = await runCertificationCheck({
      context: TEST_CONTEXT,
      checkId: "cert-check-performance-scan",
      ...TEST_ACTOR,
    });
    assert.ok(["pass", "pass_with_conditions", "warning"].includes(result.status));
  });

  it("detects performance bottlenecks when API latency exceeds registry target", () => {
    resetProductionCertificationHarnessForTests();
    configurePerformanceTestEnvironment();
    process.env.PERF_API_LATENCY_MS = "5000";
    process.env.PERF_API_SLOW = "true";
    const scan = runPerformanceScan(TEST_ACTOR);
    assert.ok(scan.bottlenecks.length >= 1 || scan.warnings.length >= 1);
    process.env.PERF_API_LATENCY_MS = "120";
    process.env.PERF_API_SLOW = "false";
  });
});
