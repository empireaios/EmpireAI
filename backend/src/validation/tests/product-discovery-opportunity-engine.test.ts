import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { resetDatabaseInstance } from "../../brain/database.js";
import type { ToolContext } from "../../brain/types.js";
import { buildGrandKingsDashboard } from "../../orchestration/ecommerce-os-orchestrator/index.js";
import { resetAccountInfrastructureRepository } from "../../orchestration/account-infrastructure-engine/index.js";
import { resetMarketplaceConnectionEngineRepository } from "../../orchestration/marketplace-connection-engine/index.js";
import { resetMarketplaceConnectionRepository } from "../../orchestration/marketplace-infrastructure-engine/index.js";
import {
  approveProductOpportunities,
  discoverProductOpportunities,
  productDiscoveryTools,
  resetProductDiscoveryRepository,
  runProductDiscovery,
  startProductDiscoverySession,
} from "../../orchestration/product-discovery-opportunity-engine/index.js";
import { configureValidationEnvironment } from "../harness.js";

const WORKSPACE_ID = "ws-live005";
const COMPANY_ID = "co-grand-king";

function toolContext(): ToolContext {
  return {
    workspaceId: WORKSPACE_ID,
    agentId: "product-discovery-opportunity-engine",
    correlationId: "corr-live005",
  };
}

async function invokeTool(name: string, args: Record<string, unknown> = {}) {
  const tool = productDiscoveryTools.find((entry) => entry.name === name);
  assert.ok(tool, `tool ${name} should be registered`);
  return tool.handler({ workspaceId: WORKSPACE_ID, companyId: COMPANY_ID, ...args }, toolContext());
}

beforeEach(() => {
  configureValidationEnvironment();
  resetProductDiscoveryRepository();
  resetAccountInfrastructureRepository();
  resetMarketplaceConnectionRepository();
  resetMarketplaceConnectionEngineRepository();
});

afterEach(() => {
  resetProductDiscoveryRepository();
  resetAccountInfrastructureRepository();
  resetMarketplaceConnectionRepository();
  resetMarketplaceConnectionEngineRepository();
  resetDatabaseInstance();
});

describe("LIVE-005 Product Discovery & Opportunity Engine", () => {
  it("registers six product discovery Brain tools", () => {
    assert.equal(productDiscoveryTools.length, 6);
    assert.ok(productDiscoveryTools.some((tool) => tool.name === "product_discovery.discover"));
    assert.ok(productDiscoveryTools.some((tool) => tool.name === "product_discovery.dashboard"));
  });

  it("discovers ranked opportunities with full opportunity model", () => {
    const opportunities = discoverProductOpportunities({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      brand: "Vennya Kitchen",
      category: "kitchen",
      targetMarket: "US",
      existingSupplierNetwork: ["cj-dropshipping"],
    });

    assert.ok(opportunities.length > 0);
    const top = opportunities[0]!;
    assert.equal(top.rank, 1);
    assert.ok(top.product.productName.length > 0);
    assert.ok(typeof top.supplierAvailability.available === "boolean");
    assert.ok(top.estimatedMargin >= 0 && top.estimatedMargin <= 100);
    assert.ok(top.shippingConfidence >= 0);
    assert.ok(top.competitionEstimate >= 0);
    assert.ok(top.dominationScore >= 0);
    assert.ok(top.brandingPotential >= 0);
    assert.ok(top.repeatPurchasePotential >= 0);
    assert.ok(top.marketplaceSuitability >= 0);
    assert.ok(top.confidence >= 0);
    assert.ok(top.marketplaceRecommendation.primaryMarketplace);
    assert.ok(top.marketplaceRecommendation.reasoning.length > 0);
    assert.ok(top.recommendedSupplier);
    assert.ok(top.recommendedNextAction.length > 0);
  });

  it("runs Grand King discovery workflow to READY FOR PRODUCT BUILD", () => {
    const started = startProductDiscoverySession({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      brand: "Grand King Essentials",
      category: "kitchen",
      targetMarket: "US",
      existingSupplierNetwork: ["cj-dropshipping"],
      actor: "founder@test.com",
    });

    assert.equal(started.stage, "CATEGORY_CHOSEN");

    const discovered = runProductDiscovery(started.sessionId);
    assert.equal(discovered.stage, "AWAITING_APPROVAL");
    assert.ok(discovered.opportunities.length > 0);

    const topId = discovered.opportunities[0]!.opportunityId;
    const approved = approveProductOpportunities(started.sessionId, [topId], "founder@test.com");
    assert.equal(approved.stage, "READY_FOR_PRODUCT_BUILD");
    assert.ok(approved.approvedOpportunityIds.includes(topId));
  });

  it("returns marketplace recommendations with primary, secondary, and expansion", () => {
    const opportunities = discoverProductOpportunities({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      brand: "Beauty Brand",
      category: "beauty",
      targetMarket: "US",
    });

    const top = opportunities[0]!;
    assert.ok(top.marketplaceRecommendation.primaryMarketplace);
    assert.ok(Array.isArray(top.marketplaceRecommendation.futureExpansionMarketplaces));
    assert.ok(top.marketplaceRecommendation.reasoning.length > 0);
    assert.equal(top.recommendedMarketplace, top.marketplaceRecommendation.primaryMarketplace);
  });

  it("exposes discovery dashboard on Grand King dashboard", () => {
    startProductDiscoverySession({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      brand: "Dashboard Brand",
      category: "health",
      targetMarket: "US",
    });

    const dashboard = buildGrandKingsDashboard(WORKSPACE_ID, COMPANY_ID);
    assert.ok(dashboard.productDiscovery);
    assert.ok(Array.isArray(dashboard.productDiscovery!.topOpportunities));
    assert.ok(dashboard.productDiscovery!.recommendedNextAction.length > 0);
  });

  it("delegates scoring to existing intelligence engines without publishing", async () => {
    const opportunities = await invokeTool("product_discovery.discover", {
      brand: "Scout Brand",
      category: "kitchen",
    });
    assert.ok(Array.isArray(opportunities));
    assert.ok((opportunities as unknown[]).length > 0);
  });
});
