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
  resetProductDiscoveryRepository,
  runProductDiscovery,
  startProductDiscoverySession,
} from "../../orchestration/product-discovery-opportunity-engine/index.js";
import {
  approveBusinessPreviewForBuild,
  businessPreviewStudioTools,
  generateBusinessPreviewForOpportunity,
  getBusinessPreview,
  listBusinessPreviews,
  regenerateBusinessPreview,
  resetBusinessPreviewRepository,
} from "../../orchestration/business-preview-studio/index.js";
import { configureValidationEnvironment } from "../harness.js";

const WORKSPACE_ID = "ws-live007";
const COMPANY_ID = "co-grand-king";

function toolContext(): ToolContext {
  return {
    workspaceId: WORKSPACE_ID,
    agentId: "business-preview-studio",
    correlationId: "corr-live007",
  };
}

async function invokeTool(name: string, args: Record<string, unknown> = {}) {
  const tool = businessPreviewStudioTools.find((entry) => entry.name === name);
  assert.ok(tool, `tool ${name} should be registered`);
  return tool.handler({ workspaceId: WORKSPACE_ID, companyId: COMPANY_ID, ...args }, toolContext());
}

function seedApprovedOpportunity() {
  const started = startProductDiscoverySession({
    workspaceId: WORKSPACE_ID,
    companyId: COMPANY_ID,
    brand: "Preview Brand",
    category: "kitchen",
    targetMarket: "US",
    existingSupplierNetwork: ["cj-dropshipping"],
    actor: "founder@test.com",
  });
  runProductDiscovery(started.sessionId);
  const opportunities = listBusinessOpportunities(WORKSPACE_ID, COMPANY_ID);
  const target = opportunities[0]!;
  approveBusinessOpportunity(target.businessOpportunityId, "founder@test.com");
  return target.businessOpportunityId;
}

beforeEach(() => {
  configureValidationEnvironment();
  resetProductDiscoveryRepository();
  resetBusinessOpportunityRepository();
  resetBusinessPreviewRepository();
  resetAccountInfrastructureRepository();
  resetMarketplaceConnectionRepository();
  resetMarketplaceConnectionEngineRepository();
});

afterEach(() => {
  resetProductDiscoveryRepository();
  resetBusinessOpportunityRepository();
  resetBusinessPreviewRepository();
  resetAccountInfrastructureRepository();
  resetMarketplaceConnectionRepository();
  resetMarketplaceConnectionEngineRepository();
  resetDatabaseInstance();
});

describe("LIVE-007 Business Preview Studio", () => {
  it("registers five business preview Brain tools", () => {
    assert.equal(businessPreviewStudioTools.length, 5);
    assert.ok(businessPreviewStudioTools.some((tool) => tool.name === "business_preview.generate"));
    assert.ok(businessPreviewStudioTools.some((tool) => tool.name === "business_preview.approve"));
  });

  it("generates complete visual business preview from approved opportunity", () => {
    const businessOpportunityId = seedApprovedOpportunity();
    const preview = generateBusinessPreviewForOpportunity(businessOpportunityId, "founder@test.com");

    assert.equal(preview.status, "GENERATED");
    assert.ok(preview.brandPreview.brand.length > 0);
    assert.ok(preview.brandPreview.logo.startsWith("preview://"));
    assert.ok(preview.brandPreview.colourPalette.primary.length > 0);
    assert.ok(preview.brandPreview.typography.headingFont.length > 0);
    assert.ok(preview.brandPreview.brandStory.length > 0);
    assert.ok(preview.productPreview.productTitle.length > 0);
    assert.ok(preview.productPreview.productDescription.length > 0);
    assert.ok(preview.productPreview.seoTitle.length > 0);
    assert.ok(preview.productPreview.seoKeywords.length > 0);
    assert.ok(preview.productPreview.heroBanner.startsWith("preview://"));
    assert.ok(preview.productPreview.productImages.length > 0);
    assert.ok(preview.productPreview.productGallery.length > 0);
    assert.ok(preview.productPreview.productVideoStoryboard.length > 0);
    assert.ok(preview.productPreview.packagingConcept.startsWith("preview://"));
    assert.ok(preview.marketplacePreview.homepagePreview.startsWith("preview://"));
    assert.ok(preview.marketplacePreview.amazonListingPreview.startsWith("preview://"));
    assert.ok(preview.marketplacePreview.tiktokShopPreview.startsWith("preview://"));
    assert.ok(preview.marketplacePreview.ebayPreview.startsWith("preview://"));
    assert.ok(preview.marketplacePreview.shopifyProductPagePreview.startsWith("preview://"));
    assert.ok(preview.marketplacePreview.googleMerchantPreview.startsWith("preview://"));
    assert.ok(preview.assetsGenerated > 0);
    assert.ok(preview.quality.overallScore >= 0);
  });

  it("lists, gets, and regenerates previews", () => {
    const businessOpportunityId = seedApprovedOpportunity();
    const generated = generateBusinessPreviewForOpportunity(businessOpportunityId);

    const listed = listBusinessPreviews(WORKSPACE_ID, COMPANY_ID);
    assert.ok(listed.some((entry) => entry.previewId === generated.previewId));

    const fetched = getBusinessPreview(generated.previewId);
    assert.ok(fetched);
    assert.equal(fetched!.previewId, generated.previewId);

    const regenerated = regenerateBusinessPreview(generated.previewId, "founder@test.com");
    assert.equal(regenerated.status, "REGENERATED");
    assert.ok(regenerated.generationVersion > generated.generationVersion);
  });

  it("approves preview for build with governance gate — no execution", () => {
    const businessOpportunityId = seedApprovedOpportunity();
    const preview = generateBusinessPreviewForOpportunity(businessOpportunityId);
    const approved = approveBusinessPreviewForBuild(preview.previewId, "founder@test.com");

    assert.equal(approved.status, "APPROVED_FOR_BUILD");
    assert.ok(approved.approvedForBuildAt);
    assert.equal(approved.approvedForBuildBy, "founder@test.com");
  });

  it("exposes business preview studio on Grand King dashboard", () => {
    const businessOpportunityId = seedApprovedOpportunity();
    generateBusinessPreviewForOpportunity(businessOpportunityId);

    const dashboard = buildGrandKingsDashboard(WORKSPACE_ID, COMPANY_ID);
    assert.ok(dashboard.businessPreviewStudio);
    assert.equal(dashboard.businessPreviewStudio!.businessPreviewReady, true);
    assert.ok(dashboard.businessPreviewStudio!.assetsGenerated > 0);
    assert.ok(dashboard.businessPreviewStudio!.previewQuality >= 0);
    assert.ok(Array.isArray(dashboard.businessPreviewStudio!.recommendedImprovements));
    assert.ok(dashboard.businessPreviewStudio!.approveForBuild.available);
  });

  it("delegates preview generation via Brain tools without publishing", async () => {
    const businessOpportunityId = seedApprovedOpportunity();
    const preview = await invokeTool("business_preview.generate", { businessOpportunityId });
    assert.ok((preview as { previewId: string }).previewId);

    const listed = await invokeTool("business_preview.list");
    assert.ok(Array.isArray(listed));
    assert.ok((listed as unknown[]).length > 0);
  });
});
