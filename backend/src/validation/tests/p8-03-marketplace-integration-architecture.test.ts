import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  MARKETPLACE_CONNECTOR_CATALOG,
  MARKETPLACE_FAILURE_RECOVERY_MAPPINGS,
  MARKETPLACE_INTEGRATION_ARCHITECTURE_VERSION,
  buildMarketplaceCockpitIntegrationView,
  buildMarketplaceIntegrationArchitectureSnapshot,
  listMarketplaceConnectorDefinitions,
  listMarketplaceIntegrationPipelinePhases,
  listMarketplaceSyncDomains,
  resetInfrastructureCommerceForTests,
} from "../../orchestration/infrastructure-commerce/index.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

const TEST_CONTEXT = { workspaceId: "ws-foundation" } as const;

describe("P8-03 — Marketplace Integration Architecture", () => {
  it("defines canonical connector catalog with mission marketplaces", () => {
    const ids = MARKETPLACE_CONNECTOR_CATALOG.map((c) => c.connectorId);
    assert.ok(ids.includes("amazon"));
    assert.ok(ids.includes("shopify"));
    assert.ok(ids.includes("tiktok-shop"));
    assert.ok(ids.includes("meta-commerce"));
    assert.ok(ids.includes("woocommerce"));
    assert.ok(ids.includes("cj-dropshipping"));
    assert.ok(ids.includes("aliexpress"));
    assert.ok(ids.includes("temu"));
    assert.equal(MARKETPLACE_CONNECTOR_CATALOG.length, 12);
  });

  it("documents connector model fields on every connector", () => {
    for (const connector of MARKETPLACE_CONNECTOR_CATALOG) {
      assert.ok(connector.purpose);
      assert.ok(connector.authenticationMethod);
      assert.ok(connector.supportedCapabilities.length >= 3);
      assert.ok(connector.rateLimits);
      assert.ok(connector.failureBehaviour);
      assert.ok(connector.recoveryBehaviour);
      assert.ok(connector.dependencies.length >= 1);
      assert.equal(connector.replaceable, true);
    }
  });

  it("exposes unified integration pipeline and sync domains", () => {
    const pipeline = listMarketplaceIntegrationPipelinePhases();
    assert.equal(pipeline.length, 11);
    assert.equal(pipeline[0], "business_created");
    assert.equal(pipeline[pipeline.length - 1], "continuous_monitoring");

    const syncDomains = listMarketplaceSyncDomains();
    assert.equal(syncDomains.length, 9);
    assert.ok(syncDomains.includes("products"));
    assert.ok(syncDomains.includes("orders"));
    assert.ok(syncDomains.includes("errors"));
  });

  it("maps failure kinds to constitutional recovery framework", () => {
    assert.equal(MARKETPLACE_FAILURE_RECOVERY_MAPPINGS.length, 6);
    for (const mapping of MARKETPLACE_FAILURE_RECOVERY_MAPPINGS) {
      assert.ok(mapping.recoveryFrameworkRef.includes("RECOVERY"));
      assert.ok(mapping.supervisorRef.includes("Supervisor"));
      assert.ok(mapping.guardianRef.includes("Guardian"));
    }
  });

  it("builds architecture snapshot consolidating G2-02 discovery", () => {
    resetInfrastructureCommerceForTests();
    const snapshot = buildMarketplaceIntegrationArchitectureSnapshot(TEST_CONTEXT);
    assert.equal(snapshot.architectureVersion, MARKETPLACE_INTEGRATION_ARCHITECTURE_VERSION);
    assert.equal(snapshot.connectorCount, listMarketplaceConnectorDefinitions().length);
    assert.equal(snapshot.connectors.length, snapshot.connectorCount);
    assert.ok(snapshot.executiveSummary.length > 10);
    assert.ok(snapshot.pillowRecommendations.length >= 2);
    assert.equal(snapshot.discoverySource, "marketplace-integration-architecture:p8-03");
  });

  it("builds cockpit integration view for SCR-205", () => {
    resetInfrastructureCommerceForTests();
    const view = buildMarketplaceCockpitIntegrationView(TEST_CONTEXT);
    assert.equal(view.screenId, "SCR-205");
    assert.equal(view.dataMode, "live");
    assert.ok(view.architecture.connectors.length >= 8);
  });
});
