import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  INFRASTRUCTURE_DEPLOYMENT_CERTIFICATION_VERSION,
  INFRASTRUCTURE_DEPLOYMENT_EKLS_KINDS,
  INFRASTRUCTURE_DEPLOYMENT_RESULT_STATES,
  buildCockpitInfrastructureDeploymentView,
  createProductionCertificationModuleContract,
  getInfrastructureDeploymentOverview,
  infrastructureDeploymentTools,
  listInfrastructureDeploymentEklsKinds,
  registerInfrastructureDeploymentPlugin,
  resetProductionCertificationHarnessForTests,
  resolveDeploymentSignals,
  resolveInfrastructureDeploymentRules,
  runInfrastructureDeploymentScan,
  searchInfrastructureDeploymentEklsObservations,
  validateDatabaseRules,
  validateHostingRules,
  validateInfrastructureDeploymentPillowGovernance,
  validateMonitoringRules,
  validateQueueRules,
  validateStorageRules,
} from "../../orchestration/production-certification/index.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

const TEST_CONTEXT = { workspaceId: "ws-foundation" } as const;
const TEST_ACTOR = {
  actorId: "grand-king",
  workspaceId: "ws-foundation",
  pillowGovernance: true as const,
};

function configureDeploymentTestEnvironment(): void {
  process.env.QUEUE_ENABLED = "true";
  process.env.CACHE_ENABLED = "true";
  process.env.STORAGE_PROVIDER = "local";
  process.env.SECRETS_VAULT = "pillow";
  process.env.EMAIL_PROVIDER = "smtp";
  process.env.DNS_DOMAIN = "empireai.local";
  process.env.MONITORING_DISABLED = "false";
  process.env.LOGGING_DISABLED = "false";
  process.env.BACKUP_DISABLED = "false";
  process.env.SSL_DISABLED = "false";
}

describe("G6-03 — Infrastructure & Deployment Certification", () => {
  it("exposes infrastructure deployment version and result states", () => {
    assert.equal(INFRASTRUCTURE_DEPLOYMENT_CERTIFICATION_VERSION, "g6-03-v1");
    assert.ok(INFRASTRUCTURE_DEPLOYMENT_RESULT_STATES.includes("pass"));
    assert.equal(INFRASTRUCTURE_DEPLOYMENT_RESULT_STATES.length, 5);
  });

  it("retains G6-03 infrastructure deployment subsystem after G6-10 module advance", () => {
    const contract = createProductionCertificationModuleContract();
    assert.equal(contract.missionId, "G6-10");
    assert.ok(contract.capabilities.includes("production-certification.deployment_scan"));
  });

  it("resolves deployment rules from REG-CERTIFICATION-DEPLOYMENT", () => {
    resetProductionCertificationHarnessForTests();
    configureDeploymentTestEnvironment();
    const rules = resolveInfrastructureDeploymentRules(TEST_CONTEXT);
    assert.ok(rules.length >= 20);
    assert.ok(rules.some((rule) => rule.ruleKind === "hosting"));
    assert.ok(rules.some((rule) => rule.ruleKind === "database"));
    assert.ok(rules.some((rule) => rule.ruleKind === "deployment_topology"));
  });

  it("validates hosting and database rules via registry signals", () => {
    resetProductionCertificationHarnessForTests();
    configureDeploymentTestEnvironment();
    const rules = resolveInfrastructureDeploymentRules(TEST_CONTEXT);
    const hosting = validateHostingRules(rules, TEST_CONTEXT);
    const database = validateDatabaseRules(rules, TEST_CONTEXT);
    assert.equal(hosting.violations.length, 0);
    assert.equal(database.violations.length, 0);
  });

  it("validates queue and storage rules without exposing secrets", () => {
    resetProductionCertificationHarnessForTests();
    configureDeploymentTestEnvironment();
    const rules = resolveInfrastructureDeploymentRules(TEST_CONTEXT);
    assert.equal(validateQueueRules(rules, TEST_CONTEXT).violations.length, 0);
    assert.equal(validateStorageRules(rules, TEST_CONTEXT).violations.length, 0);
    const signals = resolveDeploymentSignals(["signal:database-configured"], TEST_CONTEXT);
    assert.equal(signals[0]?.summary.includes("redacted"), true);
  });

  it("validates monitoring infrastructure rules", () => {
    resetProductionCertificationHarnessForTests();
    configureDeploymentTestEnvironment();
    const rules = resolveInfrastructureDeploymentRules(TEST_CONTEXT);
    assert.equal(validateMonitoringRules(rules, TEST_CONTEXT).violations.length, 0);
  });

  it("registers all required deployment Brain tools", () => {
    const names = new Set(infrastructureDeploymentTools.map((tool) => tool.name));
    for (const toolName of [
      "deployment_overview",
      "deployment_scan",
      "deployment_health",
      "deployment_readiness",
      "deployment_dependencies",
      "deployment_risk_register",
      "deployment_status",
    ]) {
      assert.equal(names.has(toolName), true, `Missing Brain tool: ${toolName}`);
    }
  });

  it("passes Pillow governance for deployment operations", () => {
    resetProductionCertificationHarnessForTests();
    configureDeploymentTestEnvironment();
    const result = validateInfrastructureDeploymentPillowGovernance({
      ...TEST_ACTOR,
      operation: "deployment_scan",
    });
    assert.equal(result.allowed, true);
    assert.equal(result.deploymentAuthority, true);
    assert.equal(result.productionEligible, true);
  });

  it("runs deployment scan and produces service health", () => {
    resetProductionCertificationHarnessForTests();
    configureDeploymentTestEnvironment();
    const scan = runInfrastructureDeploymentScan(TEST_ACTOR);
    assert.ok(scan.scanId);
    assert.ok(["pass", "pass_with_conditions", "warning"].includes(scan.status));
    assert.ok(scan.serviceHealth.length >= 5);
    assert.equal(scan.discoverySource, "REG-CERTIFICATION-DEPLOYMENT");

    const overview = getInfrastructureDeploymentOverview(TEST_CONTEXT);
    assert.equal(overview.lastScanId, scan.scanId);
  });

  it("records deployment EKLS observations through Pillow", () => {
    resetProductionCertificationHarnessForTests();
    configureDeploymentTestEnvironment();
    assert.deepEqual(listInfrastructureDeploymentEklsKinds(), [...INFRASTRUCTURE_DEPLOYMENT_EKLS_KINDS]);
    runInfrastructureDeploymentScan(TEST_ACTOR);

    const search = searchInfrastructureDeploymentEklsObservations({
      actorId: TEST_ACTOR.actorId,
      workspaceId: TEST_ACTOR.workspaceId,
      kind: "deployment_certified",
      pillowGovernance: true,
    });
    assert.ok(search.length >= 1);
  });

  it("exposes Cockpit infrastructure deployment backend contract", () => {
    resetProductionCertificationHarnessForTests();
    configureDeploymentTestEnvironment();
    const scan = runInfrastructureDeploymentScan(TEST_ACTOR);
    const overview = getInfrastructureDeploymentOverview(TEST_CONTEXT);
    const view = buildCockpitInfrastructureDeploymentView({ overview, scan });
    assert.equal(view.viewId, "cockpit-infrastructure-deployment");
    assert.equal(view.certificationStatus, scan.status);
    assert.ok(view.executiveRecommendations.length >= 1);
  });

  it("supports deployment validator plugins without modifying certification core", () => {
    resetProductionCertificationHarnessForTests();
    configureDeploymentTestEnvironment();
    const registered = registerInfrastructureDeploymentPlugin({
      manifest: {
        pluginId: "test-deployment-plugin",
        pluginName: "Test Deployment Plugin",
        validatorKind: "deployment",
        pillowGovernance: true,
      },
      hooks: {
        pluginId: "test-deployment-plugin",
        validatorKind: "deployment",
        validate: () => [],
      },
      ...TEST_ACTOR,
    });
    assert.equal(registered.accepted, true);
    runInfrastructureDeploymentScan(TEST_ACTOR);
  });

  it("runs deployment scan via Brain tool handler", async () => {
    resetProductionCertificationHarnessForTests();
    configureDeploymentTestEnvironment();
    const tool = infrastructureDeploymentTools.find((entry) => entry.name === "deployment_scan");
    assert.ok(tool);
    const result = await tool!.handler(
      { workspaceId: TEST_ACTOR.workspaceId, actorId: TEST_ACTOR.actorId },
      { workspaceId: TEST_ACTOR.workspaceId, agentId: "test-agent", correlationId: "corr-g6-03" },
    );
    assert.ok((result as { scanId: string }).scanId);
  });

  it("runs certification probe for infrastructure deployment scan check", async () => {
    resetProductionCertificationHarnessForTests();
    configureDeploymentTestEnvironment();
    const { runCertificationCheck } = await import(
      "../../orchestration/production-certification/services/certification-runner-service.js"
    );
    const result = await runCertificationCheck({
      context: TEST_CONTEXT,
      checkId: "cert-check-infrastructure-deployment-scan",
      ...TEST_ACTOR,
    });
    assert.ok(["pass", "pass_with_conditions", "warning"].includes(result.status));
  });
});
