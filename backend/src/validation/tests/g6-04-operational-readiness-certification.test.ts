import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  OPERATIONAL_READINESS_CERTIFICATION_VERSION,
  OPERATIONAL_READINESS_EKLS_KINDS,
  OPERATIONAL_READINESS_RESULT_STATES,
  buildCockpitOperationalReadinessView,
  createProductionCertificationModuleContract,
  getOperationalReadinessOverview,
  listOperationalReadinessEklsKinds,
  mapOperationalStatusToCertification,
  operationalReadinessTools,
  registerOperationalReadinessPlugin,
  resetProductionCertificationHarnessForTests,
  resolveOperationalReadinessRules,
  resolveOperationalSignals,
  runOperationalScan,
  searchOperationalReadinessEklsObservations,
  validateAutomationReadiness,
  validateCommerceReadiness,
  validateExternalDependencyReadiness,
  validateMonitoringReadiness,
  validateOperationalReadinessPillowGovernance,
} from "../../orchestration/production-certification/index.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

const TEST_CONTEXT = { workspaceId: "ws-foundation" } as const;
const TEST_ACTOR = {
  actorId: "grand-king",
  workspaceId: "ws-foundation",
  pillowGovernance: true as const,
};

function configureOperationalTestEnvironment(): void {
  process.env.MONITORING_DISABLED = "false";
  process.env.LOGGING_DISABLED = "false";
  process.env.QUEUE_DISABLED = "false";
  process.env.QUEUE_FAILURES = "false";
  process.env.RECOVERY_DISABLED = "false";
  process.env.BRAIN_UNAVAILABLE = "false";
}

describe("G6-04 — Operational Readiness Certification", () => {
  it("exposes operational readiness version and result states", () => {
    assert.equal(OPERATIONAL_READINESS_CERTIFICATION_VERSION, "g6-04-v1");
    assert.ok(OPERATIONAL_READINESS_RESULT_STATES.includes("ready"));
    assert.ok(OPERATIONAL_READINESS_RESULT_STATES.includes("not_ready"));
    assert.equal(OPERATIONAL_READINESS_RESULT_STATES.length, 6);
  });

  it("retains G6-04 operational readiness subsystem after G6-10 module advance", () => {
    const contract = createProductionCertificationModuleContract();
    assert.equal(contract.missionId, "G6-10");
    assert.ok(contract.capabilities.includes("production-certification.operational_scan"));
  });

  it("maps operational status to certification probe states", () => {
    assert.equal(mapOperationalStatusToCertification("ready"), "pass");
    assert.equal(mapOperationalStatusToCertification("ready_with_conditions"), "pass_with_conditions");
    assert.equal(mapOperationalStatusToCertification("not_ready"), "fail");
    assert.equal(mapOperationalStatusToCertification("blocked"), "blocked");
  });

  it("resolves operational rules from REG-CERTIFICATION-OPERATIONAL", () => {
    resetProductionCertificationHarnessForTests();
    configureOperationalTestEnvironment();
    const rules = resolveOperationalReadinessRules(TEST_CONTEXT);
    assert.ok(rules.length >= 19);
    assert.ok(rules.some((rule) => rule.ruleKind === "automation"));
    assert.ok(rules.some((rule) => rule.ruleKind === "commerce"));
    assert.ok(rules.some((rule) => rule.ruleKind === "monitoring"));
  });

  it("validates automation and commerce readiness via registry signals", () => {
    resetProductionCertificationHarnessForTests();
    configureOperationalTestEnvironment();
    const rules = resolveOperationalReadinessRules(TEST_CONTEXT);
    const automation = validateAutomationReadiness(rules, TEST_CONTEXT);
    const commerce = validateCommerceReadiness(rules, TEST_CONTEXT);
    assert.equal(automation.blockers.length, 0);
    assert.equal(commerce.blockers.length, 0);
  });

  it("validates external dependencies and monitoring without exposing secrets", () => {
    resetProductionCertificationHarnessForTests();
    configureOperationalTestEnvironment();
    const rules = resolveOperationalReadinessRules(TEST_CONTEXT);
    assert.equal(validateExternalDependencyReadiness(rules, TEST_CONTEXT).blockers.length, 0);
    assert.equal(validateMonitoringReadiness(rules, TEST_CONTEXT).blockers.length, 0);
    const signals = resolveOperationalSignals(["signal:monitoring-ready"], TEST_CONTEXT);
    assert.equal(signals[0]?.summary.includes("secret"), false);
    assert.equal(signals[0]?.summary.includes("token"), false);
  });

  it("registers all required operational Brain tools", () => {
    const names = new Set(operationalReadinessTools.map((tool) => tool.name));
    for (const toolName of [
      "operational_readiness",
      "operational_scan",
      "operational_blockers",
      "operational_score",
      "operational_dependencies",
      "operational_recommendations",
      "operational_status",
    ]) {
      assert.equal(names.has(toolName), true, `Missing Brain tool: ${toolName}`);
    }
  });

  it("passes Pillow governance for operational operations", () => {
    resetProductionCertificationHarnessForTests();
    configureOperationalTestEnvironment();
    const result = validateOperationalReadinessPillowGovernance({
      ...TEST_ACTOR,
      operation: "operational_scan",
    });
    assert.equal(result.allowed, true);
    assert.equal(result.operationalAuthority, true);
    assert.equal(result.readinessAuthority, true);
    assert.equal(result.productionEligible, true);
  });

  it("runs operational scan and produces dependency matrix", () => {
    resetProductionCertificationHarnessForTests();
    configureOperationalTestEnvironment();
    const scan = runOperationalScan(TEST_ACTOR);
    assert.ok(scan.scanId);
    assert.ok(["ready", "ready_with_conditions", "warning"].includes(scan.status));
    assert.ok(scan.dependencies.length >= 5);
    assert.equal(scan.discoverySource, "REG-CERTIFICATION-OPERATIONAL");

    const overview = getOperationalReadinessOverview(TEST_CONTEXT);
    assert.equal(overview.lastScanId, scan.scanId);
  });

  it("records operational EKLS observations through Pillow", () => {
    resetProductionCertificationHarnessForTests();
    configureOperationalTestEnvironment();
    assert.deepEqual(listOperationalReadinessEklsKinds(), [...OPERATIONAL_READINESS_EKLS_KINDS]);
    runOperationalScan(TEST_ACTOR);

    const search = searchOperationalReadinessEklsObservations({
      actorId: TEST_ACTOR.actorId,
      workspaceId: TEST_ACTOR.workspaceId,
      kind: "operational_scan_completed",
      pillowGovernance: true,
    });
    assert.ok(search.length >= 1);
  });

  it("exposes Cockpit operational readiness backend contract", () => {
    resetProductionCertificationHarnessForTests();
    configureOperationalTestEnvironment();
    const scan = runOperationalScan(TEST_ACTOR);
    const overview = getOperationalReadinessOverview(TEST_CONTEXT);
    const view = buildCockpitOperationalReadinessView({ overview, scan });
    assert.equal(view.viewId, "cockpit-operational-readiness");
    assert.equal(view.certificationStatus, scan.status);
    assert.ok(view.executiveRecommendations.length >= 1);
  });

  it("supports operational validator plugins without modifying certification core", () => {
    resetProductionCertificationHarnessForTests();
    configureOperationalTestEnvironment();
    const registered = registerOperationalReadinessPlugin({
      manifest: {
        pluginId: "test-operational-plugin",
        pluginName: "Test Operational Plugin",
        validatorKind: "operational",
        pillowGovernance: true,
      },
      hooks: {
        pluginId: "test-operational-plugin",
        validatorKind: "operational",
        validate: () => [],
      },
      ...TEST_ACTOR,
    });
    assert.equal(registered.accepted, true);
    runOperationalScan(TEST_ACTOR);
  });

  it("runs operational scan via Brain tool handler", async () => {
    resetProductionCertificationHarnessForTests();
    configureOperationalTestEnvironment();
    const tool = operationalReadinessTools.find((entry) => entry.name === "operational_scan");
    assert.ok(tool);
    const result = await tool!.handler(
      { workspaceId: TEST_ACTOR.workspaceId, actorId: TEST_ACTOR.actorId },
      { workspaceId: TEST_ACTOR.workspaceId, agentId: "test-agent", correlationId: "corr-g6-04" },
    );
    assert.ok((result as { scanId: string }).scanId);
  });

  it("runs certification probe for operational readiness scan check", async () => {
    resetProductionCertificationHarnessForTests();
    configureOperationalTestEnvironment();
    const { runCertificationCheck } = await import(
      "../../orchestration/production-certification/services/certification-runner-service.js"
    );
    const result = await runCertificationCheck({
      context: TEST_CONTEXT,
      checkId: "cert-check-operational-readiness",
      ...TEST_ACTOR,
    });
    assert.ok(["pass", "pass_with_conditions", "warning"].includes(result.status));
  });

  it("detects operational blockers when queue failures are simulated", () => {
    resetProductionCertificationHarnessForTests();
    configureOperationalTestEnvironment();
    process.env.QUEUE_FAILURES = "true";
    const scan = runOperationalScan(TEST_ACTOR);
    assert.ok(scan.blockers.length >= 1 || scan.warnings.length >= 1);
    process.env.QUEUE_FAILURES = "false";
  });
});
