import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { resetDatabaseInstance } from "../../brain/database.js";
import {
  createShopifyRuntimePlugin,
  getRuntimePluginRegistry,
  MarketplaceRuntimePlugin,
  resetRuntimePluginRegistry,
  MARKETPLACE_LOOKUP_CAPABILITIES,
} from "../../runtime/plugins/index.js";
import {
  dispatchViaPlugin,
  resetCommerceRuntimeRepository,
} from "../../runtime/commerce-runtime/index.js";
import { configureValidationEnvironment } from "../harness.js";

const WORKSPACE_ID = "ws-b001";
const COMPANY_ID = "co-grand-king";

describe("Build Wave 1 — Runtime Plugin Foundation (B-001–B-005)", () => {
  beforeEach(() => {
    configureValidationEnvironment();
    resetDatabaseInstance();
    resetCommerceRuntimeRepository();
    resetRuntimePluginRegistry();
  });

  afterEach(() => {
    resetRuntimePluginRegistry();
    resetCommerceRuntimeRepository();
    resetDatabaseInstance();
  });

  it("B-001 — exposes IRuntimePlugin framework types", () => {
    const shopify = createShopifyRuntimePlugin();
    assert.ok(shopify.manifest.pluginId);
    assert.ok(shopify.declareCapabilities().length > 0);
    assert.equal(shopify.getHealth().executionBlocked, true);
  });

  it("B-002 — MarketplaceRuntimePlugin declares marketplace capabilities", () => {
    const shopify = createShopifyRuntimePlugin();
    assert.ok(shopify instanceof MarketplaceRuntimePlugin);
    assert.ok(shopify.supportsMarketplaceCapability("publish_product"));
    assert.ok(shopify.supportsMarketplaceCapability("inventory"));
    assert.equal(shopify.supportsMarketplaceCapability("messaging"), false);
  });

  it("B-003 — ShopifyRuntimePlugin skeleton is architecture only", () => {
    const shopify = createShopifyRuntimePlugin();
    assert.equal(shopify.manifest.pluginId, "shopify");
    assert.equal(shopify.manifest.version, "2024-10.0-arch");
    assert.equal(shopify.manifest.certificationState, "UNCERTIFIED");
    assert.equal(shopify.manifest.executionState, "ARCHITECTURE_ONLY");
    assert.deepEqual(shopify.manifest.dependencies, ["reality-integration", "commerce-runtime"]);
  });

  it("B-004 — plugin registry supports register, enable, and capability lookup", () => {
    const registry = getRuntimePluginRegistry();
    registry.enable("shopify");

    const publishMatches = registry.lookupByCapability("publish_product");
    assert.ok(publishMatches.some((m) => m.pluginId === "shopify"));

    const coverage = registry.buildCapabilityCoverage();
    assert.equal(coverage.length, MARKETPLACE_LOOKUP_CAPABILITIES.length);
    assert.ok((coverage.find((c) => c.capabilityId === "orders")?.plugins.length ?? 0) > 0);
  });

  it("B-005 — plugin dispatch returns BLOCKED for certified architecture-only plugin", () => {
    const registry = getRuntimePluginRegistry();
    registry.enable("shopify");

    const dispatch = dispatchViaPlugin({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      operation: "publish_product",
      pluginId: "shopify",
      productId: "prod-1",
    });

    assert.equal(dispatch.outcome, "BLOCKED");
    assert.equal(dispatch.executionBlocked, true);
    assert.equal(dispatch.pluginId, "shopify");
    assert.ok(dispatch.planId);
  });

  it("B-005 — plugin dispatch returns NOT_IMPLEMENTED when capability unsupported", () => {
    const dispatch = dispatchViaPlugin({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      operation: "create_shipment",
    });
    assert.equal(dispatch.outcome, "NOT_IMPLEMENTED");
  });
});
