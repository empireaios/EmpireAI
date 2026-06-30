import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { resetDatabaseInstance } from "../../brain/database.js";
import type { ToolContext } from "../../brain/types.js";
import { buildGrandKingsDashboard } from "../../orchestration/ecommerce-os-orchestrator/index.js";
import { resetAccountInfrastructureRepository } from "../../orchestration/account-infrastructure-engine/index.js";
import { resetMarketplaceConnectionEngineRepository } from "../../orchestration/marketplace-connection-engine/index.js";
import { resetMarketplaceConnectionRepository } from "../../orchestration/marketplace-infrastructure-engine/index.js";
import {
  approveBusinessOpportunity,
  listBusinessOpportunities,
  resetBusinessOpportunityRepository,
} from "../../orchestration/business-opportunity-workspace/index.js";
import {
  approveBusinessPreviewForBuild,
  generateBusinessPreviewForOpportunity,
  resetBusinessPreviewRepository,
} from "../../orchestration/business-preview-studio/index.js";
import {
  businessBuildEngineTools,
  resetBusinessBuildRepository,
  startBusinessBuild,
  validateBusinessBuild,
  buildBusinessBuildSummary,
} from "../../orchestration/business-build-engine/index.js";
import {
  generateMarketStrategyForOpportunity,
  resetMarketStrategyRepository,
} from "../../orchestration/market-domination-strategy-engine/index.js";
import {
  resetProductDiscoveryRepository,
  runProductDiscovery,
  startProductDiscoverySession,
} from "../../orchestration/product-discovery-opportunity-engine/index.js";
import { configureValidationEnvironment } from "../harness.js";

const WORKSPACE_ID = "ws-live009";
const COMPANY_ID = "co-grand-king";

function toolContext(): ToolContext {
  return {
    workspaceId: WORKSPACE_ID,
    agentId: "business-build-engine",
    correlationId: "corr-live009",
  };
}

async function invokeTool(name: string, args: Record<string, unknown> = {}) {
  const tool = businessBuildEngineTools.find((entry) => entry.name === name);
  assert.ok(tool, `tool ${name} should be registered`);
  return tool.handler({ workspaceId: WORKSPACE_ID, companyId: COMPANY_ID, ...args }, toolContext());
}

function seedBuildReadyOpportunity() {
  const started = startProductDiscoverySession({
    workspaceId: WORKSPACE_ID,
    companyId: COMPANY_ID,
    brand: "Build Brand",
    category: "kitchen",
    targetMarket: "US",
    existingSupplierNetwork: ["cj-dropshipping"],
    actor: "founder@test.com",
  });
  runProductDiscovery(started.sessionId);
  const opportunities = listBusinessOpportunities(WORKSPACE_ID, COMPANY_ID);
  const target = opportunities[0]!;
  approveBusinessOpportunity(target.businessOpportunityId, "founder@test.com");
  const preview = generateBusinessPreviewForOpportunity(target.businessOpportunityId);
  approveBusinessPreviewForBuild(preview.previewId, "founder@test.com");
  generateMarketStrategyForOpportunity(target.businessOpportunityId);
  return target.businessOpportunityId;
}

beforeEach(() => {
  configureValidationEnvironment();
  resetProductDiscoveryRepository();
  resetBusinessOpportunityRepository();
  resetBusinessPreviewRepository();
  resetMarketStrategyRepository();
  resetBusinessBuildRepository();
  resetAccountInfrastructureRepository();
  resetMarketplaceConnectionRepository();
  resetMarketplaceConnectionEngineRepository();
});

afterEach(() => {
  resetProductDiscoveryRepository();
  resetBusinessOpportunityRepository();
  resetBusinessPreviewRepository();
  resetMarketStrategyRepository();
  resetBusinessBuildRepository();
  resetAccountInfrastructureRepository();
  resetMarketplaceConnectionRepository();
  resetMarketplaceConnectionEngineRepository();
  resetDatabaseInstance();
});

describe("LIVE-009 Business Build Engine", () => {
  it("registers five business build Brain tools", () => {
    assert.equal(businessBuildEngineTools.length, 5);
    assert.ok(businessBuildEngineTools.some((tool) => tool.name === "business_build.start"));
    assert.ok(businessBuildEngineTools.some((tool) => tool.name === "business_build.validate"));
  });

  it("assembles complete build package from approved preview and strategy", () => {
    const businessOpportunityId = seedBuildReadyOpportunity();
    const build = startBusinessBuild(businessOpportunityId, "founder@test.com");

    assert.ok(["BUILDING", "READY_FOR_PUBLICATION"].includes(build.status));
    assert.ok(build.brandAssets.finalBrandName.length > 0);
    assert.ok(build.brandAssets.brandGuidelines.length > 0);
    assert.ok(build.brandAssets.brandVoice.length > 0);
    assert.ok(build.productAssets.productSubtitle.length > 0);
    assert.ok(build.productAssets.productFeatures.length > 0);
    assert.ok(build.productAssets.faq.length > 0);
    assert.ok(build.visualAssets.lifestyleImages.length > 0);
    assert.ok(build.visualAssets.infographics.length > 0);
    assert.ok(build.videoAssets.shotList.length > 0);
    assert.ok(build.videoAssets.captionSuggestions.length > 0);
    assert.ok(build.seoAssets.marketplaceSearchTerms.length > 0);
    assert.equal(build.marketplacePackages.length, 5);
    for (const pkg of build.marketplacePackages) {
      assert.equal(pkg.publishBlocked, true);
      assert.ok(pkg.title.length > 0);
    }
    assert.equal(build.supplierPackage.executionBlocked, true);
    assert.ok(build.supplierPackage.shippingRules.length > 0);
    assert.ok(build.buildProgress > 0);
  });

  it("validates build package and reports publication readiness", () => {
    const businessOpportunityId = seedBuildReadyOpportunity();
    const build = startBusinessBuild(businessOpportunityId);
    const validation = validateBusinessBuild(build.buildId);

    assert.ok(validation.assetsCompleted > 0);
    assert.equal(validation.assetsRequired, 6);
    assert.ok(validation.marketplacePackagesReady > 0);
    assert.ok(validation.publicationReadiness >= 0);
    assert.ok(Array.isArray(validation.blockers));
  });

  it("builds workspace summary", () => {
    const businessOpportunityId = seedBuildReadyOpportunity();
    startBusinessBuild(businessOpportunityId);

    const summary = buildBusinessBuildSummary(WORKSPACE_ID, COMPANY_ID);
    assert.equal(summary.totalBuilds, 1);
    assert.ok(summary.latestBuild);
  });

  it("exposes business build engine on Grand King dashboard", () => {
    const businessOpportunityId = seedBuildReadyOpportunity();
    startBusinessBuild(businessOpportunityId);

    const dashboard = buildGrandKingsDashboard(WORKSPACE_ID, COMPANY_ID);
    assert.ok(dashboard.businessBuildEngine);
    assert.ok(dashboard.businessBuildEngine!.businessBuildProgress >= 0);
    assert.ok(dashboard.businessBuildEngine!.assetsCompleted >= 0);
    assert.ok(dashboard.businessBuildEngine!.publicationReadiness >= 0);
  });

  it("starts build via Brain tools without publishing or fulfillment", async () => {
    const businessOpportunityId = seedBuildReadyOpportunity();
    const build = await invokeTool("business_build.start", { businessOpportunityId });
    assert.ok((build as { buildId: string }).buildId);

    const validation = await invokeTool("business_build.validate", {
      buildId: (build as { buildId: string }).buildId,
    });
    assert.ok((validation as { publicationReadiness: number }).publicationReadiness >= 0);
  });
});
