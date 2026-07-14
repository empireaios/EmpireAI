import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

import {
  ANALYTICS_INTEGRATION_VERSION,
  COMMERCE_ORCHESTRATION_VERSION,
  COMMERCE_PLUGIN_INTEGRATION_VERSION,
  LOGISTICS_INTEGRATION_VERSION,
  MARKETPLACE_INTEGRATION_VERSION,
  PAYMENT_INTEGRATION_VERSION,
  STOREFRONT_INTEGRATION_VERSION,
  SUPPLIER_INTEGRATION_VERSION,
  createInfrastructureCommerceModuleContract,
  discoverCommerceCapabilitiesForBrain,
  discoverCommercePluginSlots,
  discoverMarketplaces,
  discoverSuppliers,
  discoverStorefronts,
  discoverPayments,
  discoverLogisticsProviders,
  discoverAnalyticsProviders,
  discoverCommerceOrchestrationProfiles,
  listCommerceRegistryIds,
  resetInfrastructureCommerceForTests,
} from "../../orchestration/infrastructure-commerce/index.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

const REPO_ROOT = join(import.meta.dirname, "../../../..");
const ARTIFACTS = join(REPO_ROOT, "artifacts");

const G2_MISSIONS = [
  "g2-01-commerce-registry-foundation",
  "g2-02-marketplace-integration-framework",
  "g2-03-supplier-integration-framework",
  "g2-04-storefront-integration-framework",
  "g2-05-payment-integration-framework",
  "g2-06-logistics-integration-framework",
  "g2-07-analytics-integration-framework",
  "g2-08-commerce-orchestration-layer",
  "g2-09-commerce-plugin-integration",
] as const;

const TEST_CONTEXT = { workspaceId: "ws-foundation" } as const;

const FORBIDDEN_HARDCODES = [
  "Amazon",
  "Shopify",
  "Stripe",
  "FedEx",
  "Walmart",
  "Alibaba",
  "PayPal",
];

describe("G2-10 — Infrastructure & Commerce Production Readiness", () => {
  it("certifies all G2-01 through G2-09 executive audit artifacts exist", () => {
    for (const mission of G2_MISSIONS) {
      const auditPath = join(ARTIFACTS, `${mission}-executive-audit.md`);
      assert.equal(
        existsSync(auditPath),
        true,
        `Missing executive audit: ${mission}-executive-audit.md`,
      );
    }
  });

  it("certifies module contract at G2-10 production-ready status", () => {
    const contract = createInfrastructureCommerceModuleContract();
    assert.equal(contract.moduleId, "infrastructure-commerce");
    assert.equal(contract.missionId, "G2-10");
    assert.equal(contract.programmeStatus, "production-certified");
    assert.ok(contract.capabilities.length >= 80);
    assert.deepEqual(contract.integratesWith, [
      "executive-intelligence-orchestrator",
      "pillow",
      "ekls",
      "brain",
      "registry",
      "guardian",
    ]);
  });

  it("certifies all G2 subsystem version constants", () => {
    assert.equal(MARKETPLACE_INTEGRATION_VERSION, "g2-02-v1");
    assert.equal(SUPPLIER_INTEGRATION_VERSION, "g2-03-v1");
    assert.equal(STOREFRONT_INTEGRATION_VERSION, "g2-04-v1");
    assert.equal(PAYMENT_INTEGRATION_VERSION, "g2-05-v1");
    assert.equal(LOGISTICS_INTEGRATION_VERSION, "g2-06-v1");
    assert.equal(ANALYTICS_INTEGRATION_VERSION, "g2-07-v1");
    assert.equal(COMMERCE_ORCHESTRATION_VERSION, "g2-08-v1");
    assert.equal(COMMERCE_PLUGIN_INTEGRATION_VERSION, "g2-09-v1");
  });

  it("certifies ten commerce registries resolve dynamically", () => {
    resetInfrastructureCommerceForTests();
    const registryIds = listCommerceRegistryIds();
    assert.equal(registryIds.length, 10);
    assert.ok(registryIds.includes("REG-MARKETPLACE"));
    assert.ok(registryIds.includes("REG-COMMERCE-POLICY"));
  });

  it("certifies Brain discovery resolves through RegistryLoader only", () => {
    resetInfrastructureCommerceForTests();
    const brain = discoverCommerceCapabilitiesForBrain(TEST_CONTEXT);
    assert.ok(brain.length >= 10);
    for (const entry of brain) {
      assert.ok(entry.registryId.startsWith("REG-"));
      assert.equal(entry.wired, true);
      assert.ok(entry.rowCount >= 1);
    }
  });

  it("certifies operational discovery across all G2 subsystems", () => {
    resetInfrastructureCommerceForTests();
    assert.ok(discoverMarketplaces(TEST_CONTEXT).discoveredCount >= 2);
    assert.ok(discoverSuppliers(TEST_CONTEXT).discoveredCount >= 2);
    assert.ok(discoverStorefronts(TEST_CONTEXT).discoveredCount >= 2);
    assert.ok(discoverPayments(TEST_CONTEXT).discoveredCount >= 2);
    assert.ok(discoverLogisticsProviders(TEST_CONTEXT).discoveredCount >= 2);
    assert.ok(discoverAnalyticsProviders(TEST_CONTEXT).discoveredCount >= 2);
    assert.ok(discoverCommerceOrchestrationProfiles(TEST_CONTEXT).discoveredCount >= 2);
    assert.equal(discoverCommercePluginSlots(TEST_CONTEXT).discoveredCount, 10);
  });

  it("certifies no hardcoded business entities across G2 operational surfaces", () => {
    resetInfrastructureCommerceForTests();
    const serialized = JSON.stringify({
      marketplaces: discoverMarketplaces(TEST_CONTEXT),
      suppliers: discoverSuppliers(TEST_CONTEXT),
      storefronts: discoverStorefronts(TEST_CONTEXT),
      payments: discoverPayments(TEST_CONTEXT),
      logistics: discoverLogisticsProviders(TEST_CONTEXT),
      analytics: discoverAnalyticsProviders(TEST_CONTEXT),
      orchestration: discoverCommerceOrchestrationProfiles(TEST_CONTEXT),
      plugins: discoverCommercePluginSlots(TEST_CONTEXT),
    }).toLowerCase();

    for (const token of FORBIDDEN_HARDCODES) {
      assert.equal(
        serialized.includes(token.toLowerCase()),
        false,
        `G2 programme must not hardcode: ${token}`,
      );
    }
  });

  it("certifies architecture ownership boundaries — commerce does not own governance", () => {
    const contract = createInfrastructureCommerceModuleContract();
    assert.ok(contract.integratesWith.includes("pillow"));
    assert.ok(contract.integratesWith.includes("brain"));
    assert.ok(contract.integratesWith.includes("ekls"));
    const integratesWith = contract.integratesWith as readonly string[];
    assert.equal(integratesWith.includes("grand-king-cockpit"), false);
  });
});
