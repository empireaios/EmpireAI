import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  BUSINESS_OPERATIONS_CERTIFICATION_VERSION,
  BUSINESS_OPERATIONS_EKLS_KINDS,
  BUSINESS_OPERATIONS_RESULT_STATES,
  buildCockpitBusinessOperationsView,
  createProductionCertificationModuleContract,
  getBusinessOperationsOverview,
  listBusinessOperationsEklsKinds,
  mapBusinessStatusToCertification,
  businessOperationsTools,
  registerBusinessOperationsPlugin,
  resetProductionCertificationHarnessForTests,
  resolveBusinessOperationsRules,
  resolveBusinessSignals,
  runBusinessOperationsScan,
  searchBusinessOperationsEklsObservations,
  validateMarketplaceCertification,
  validatePaymentCertification,
  validateSupplierCertification,
  validateStorefrontCertification,
  validateAnalyticsCertification,
  validateBusinessOperationsPillowGovernance,
} from "../../orchestration/production-certification/index.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

const TEST_CONTEXT = { workspaceId: "ws-foundation" } as const;
const TEST_ACTOR = {
  actorId: "grand-king",
  workspaceId: "ws-foundation",
  pillowGovernance: true as const,
};

function configureBusinessTestEnvironment(): void {
  process.env.MARKETPLACE_UNAVAILABLE = "false";
  process.env.SUPPLIER_UNAVAILABLE = "false";
  process.env.STOREFRONT_UNAVAILABLE = "false";
  process.env.PAYMENT_UNAVAILABLE = "false";
  process.env.ORDER_LIFECYCLE_INCOMPLETE = "false";
  process.env.ANALYTICS_DISABLED = "false";
  process.env.AUTOMATION_UNAVAILABLE = "false";
  process.env.WORKFLOW_FAILURES = "false";
  process.env.BUSINESS_PLUGIN_INCOMPATIBLE = "false";
  process.env.COMMERCE_INCONSISTENCY = "false";
}

describe("G6-05 — Business Operations Certification", () => {
  it("exposes business operations version and result states", () => {
    assert.equal(BUSINESS_OPERATIONS_CERTIFICATION_VERSION, "g6-05-v1");
    assert.ok(BUSINESS_OPERATIONS_RESULT_STATES.includes("ready"));
    assert.ok(BUSINESS_OPERATIONS_RESULT_STATES.includes("not_ready"));
    assert.equal(BUSINESS_OPERATIONS_RESULT_STATES.length, 6);
  });

  it("retains G6-05 business operations subsystem after G6-10 module advance", () => {
    const contract = createProductionCertificationModuleContract();
    assert.equal(contract.missionId, "G6-10");
    assert.ok(contract.capabilities.includes("production-certification.business_operations_scan"));
  });

  it("maps business status to certification probe states", () => {
    assert.equal(mapBusinessStatusToCertification("ready"), "pass");
    assert.equal(mapBusinessStatusToCertification("ready_with_conditions"), "pass_with_conditions");
    assert.equal(mapBusinessStatusToCertification("not_ready"), "fail");
    assert.equal(mapBusinessStatusToCertification("blocked"), "blocked");
  });

  it("resolves business rules from REG-CERTIFICATION-BUSINESS", () => {
    resetProductionCertificationHarnessForTests();
    configureBusinessTestEnvironment();
    const rules = resolveBusinessOperationsRules(TEST_CONTEXT);
    assert.ok(rules.length >= 15);
    assert.ok(rules.some((rule) => rule.ruleKind === "marketplace"));
    assert.ok(rules.some((rule) => rule.ruleKind === "supplier"));
    assert.ok(rules.some((rule) => rule.ruleKind === "payment"));
  });

  it("validates marketplace, supplier, storefront, and payment certification", () => {
    resetProductionCertificationHarnessForTests();
    configureBusinessTestEnvironment();
    const rules = resolveBusinessOperationsRules(TEST_CONTEXT);
    assert.equal(validateMarketplaceCertification(rules, TEST_CONTEXT).failures.length, 0);
    assert.equal(validateSupplierCertification(rules, TEST_CONTEXT).failures.length, 0);
    assert.equal(validateStorefrontCertification(rules, TEST_CONTEXT).failures.length, 0);
    assert.equal(validatePaymentCertification(rules, TEST_CONTEXT).failures.length, 0);
  });

  it("validates analytics certification without exposing secrets", () => {
    resetProductionCertificationHarnessForTests();
    configureBusinessTestEnvironment();
    const rules = resolveBusinessOperationsRules(TEST_CONTEXT);
    assert.equal(validateAnalyticsCertification(rules, TEST_CONTEXT).failures.length, 0);
    const signals = resolveBusinessSignals(["signal:analytics-ready"], TEST_CONTEXT);
    assert.equal(signals[0]?.summary.includes("secret"), false);
    assert.equal(signals[0]?.summary.includes("token"), false);
    assert.equal(signals[0]?.summary.includes("customer"), false);
  });

  it("registers all required business operations Brain tools", () => {
    const names = new Set(businessOperationsTools.map((tool) => tool.name));
    for (const toolName of [
      "business_operations_overview",
      "business_operations_scan",
      "business_operations_score",
      "business_operations_dependencies",
      "business_operations_risks",
      "business_operations_recommendations",
      "business_operations_status",
    ]) {
      assert.equal(names.has(toolName), true, `Missing Brain tool: ${toolName}`);
    }
  });

  it("passes Pillow governance for business operations", () => {
    resetProductionCertificationHarnessForTests();
    configureBusinessTestEnvironment();
    const result = validateBusinessOperationsPillowGovernance({
      ...TEST_ACTOR,
      operation: "business_scan",
    });
    assert.equal(result.allowed, true);
    assert.equal(result.businessAuthority, true);
    assert.equal(result.commerceAuthority, true);
    assert.equal(result.certificationAuthority, true);
    assert.equal(result.productionEligible, true);
  });

  it("runs business scan and produces commerce health summary", () => {
    resetProductionCertificationHarnessForTests();
    configureBusinessTestEnvironment();
    const scan = runBusinessOperationsScan(TEST_ACTOR);
    assert.ok(scan.scanId);
    assert.ok(["ready", "ready_with_conditions", "warning"].includes(scan.status));
    assert.ok(scan.dependencies.length >= 5);
    assert.equal(scan.commerceHealth.marketplaceReady, true);
    assert.equal(scan.discoverySource, "REG-CERTIFICATION-BUSINESS");

    const overview = getBusinessOperationsOverview(TEST_CONTEXT);
    assert.equal(overview.lastScanId, scan.scanId);
  });

  it("records business EKLS observations through Pillow", () => {
    resetProductionCertificationHarnessForTests();
    configureBusinessTestEnvironment();
    assert.deepEqual(listBusinessOperationsEklsKinds(), [...BUSINESS_OPERATIONS_EKLS_KINDS]);
    runBusinessOperationsScan(TEST_ACTOR);

    const search = searchBusinessOperationsEklsObservations({
      actorId: TEST_ACTOR.actorId,
      workspaceId: TEST_ACTOR.workspaceId,
      kind: "business_scan_completed",
      pillowGovernance: true,
    });
    assert.ok(search.length >= 1);
  });

  it("exposes Cockpit business operations backend contract", () => {
    resetProductionCertificationHarnessForTests();
    configureBusinessTestEnvironment();
    const scan = runBusinessOperationsScan(TEST_ACTOR);
    const overview = getBusinessOperationsOverview(TEST_CONTEXT);
    const view = buildCockpitBusinessOperationsView({ overview, scan });
    assert.equal(view.viewId, "cockpit-business-operations");
    assert.equal(view.certificationStatus, scan.status);
    assert.ok(view.recommendations.length >= 1);
    assert.equal(view.commerceHealth.marketplaceReady, true);
  });

  it("supports business validator plugins without modifying certification core", () => {
    resetProductionCertificationHarnessForTests();
    configureBusinessTestEnvironment();
    const registered = registerBusinessOperationsPlugin({
      manifest: {
        pluginId: "test-business-plugin",
        pluginName: "Test Business Plugin",
        validatorKind: "business",
        pillowGovernance: true,
      },
      hooks: {
        pluginId: "test-business-plugin",
        validatorKind: "business",
        validate: () => [],
      },
      ...TEST_ACTOR,
    });
    assert.equal(registered.accepted, true);
    runBusinessOperationsScan(TEST_ACTOR);
  });

  it("runs business scan via Brain tool handler", async () => {
    resetProductionCertificationHarnessForTests();
    configureBusinessTestEnvironment();
    const tool = businessOperationsTools.find((entry) => entry.name === "business_operations_scan");
    assert.ok(tool);
    const result = await tool!.handler(
      { workspaceId: TEST_ACTOR.workspaceId, actorId: TEST_ACTOR.actorId },
      { workspaceId: TEST_ACTOR.workspaceId, agentId: "test-agent", correlationId: "corr-g6-05" },
    );
    assert.ok((result as { scanId: string }).scanId);
  });

  it("runs certification probe for business operations scan check", async () => {
    resetProductionCertificationHarnessForTests();
    configureBusinessTestEnvironment();
    const { runCertificationCheck } = await import(
      "../../orchestration/production-certification/services/certification-runner-service.js"
    );
    const result = await runCertificationCheck({
      context: TEST_CONTEXT,
      checkId: "cert-check-business-operations-scan",
      ...TEST_ACTOR,
    });
    assert.ok(["pass", "pass_with_conditions", "warning"].includes(result.status));
  });

  it("detects business failures when payment is unavailable", () => {
    resetProductionCertificationHarnessForTests();
    configureBusinessTestEnvironment();
    process.env.PAYMENT_UNAVAILABLE = "true";
    const scan = runBusinessOperationsScan(TEST_ACTOR);
    assert.ok(scan.failures.length >= 1 || scan.warnings.length >= 1);
    process.env.PAYMENT_UNAVAILABLE = "false";
  });
});
