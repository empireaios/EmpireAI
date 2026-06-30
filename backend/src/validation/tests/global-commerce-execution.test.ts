import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { resetDatabaseInstance } from "../../brain/database.js";
import { initializeExecutiveRegistry } from "../../executive-council/services/executive-registry-service.js";
import { configureValidationEnvironment } from "../harness.js";
import {
  MARKETPLACE_ADAPTERS,
  MARKETPLACE_PUBLISH_IDS,
  buildMarketplaceListingPackage,
  enqueueMarketplacePublish,
  resetMarketplacePublishing,
  marketplacePublishingTools,
} from "../../runtime/marketplace-publishing/index.js";
import {
  buildListingIntelligence,
  resetListingIntelligence,
  listingIntelligenceTools,
  LISTING_INTELLIGENCE_MISSION_IDS,
} from "../../runtime/listing-intelligence/index.js";
import {
  buildProductMediaIntelligence,
  productMediaTools,
  PRODUCT_MEDIA_MISSION_IDS,
} from "../../runtime/product-media/index.js";
import {
  buildCommerceExecutionPipeline,
  buildGlobalCommerceExecutionDashboard,
  resetCommerceExecutionPipelines,
  COMMERCE_EXECUTION_STAGES,
  commerceExecutionPipelineTools,
  GLOBAL_COMMERCE_EXECUTION_MISSION_IDS,
} from "../../runtime/commerce-execution-pipeline/index.js";
import {
  buildExecutiveVisualDebate,
  recordGrandKingDecision,
  executiveVisualDebateTools,
  VISUAL_DEBATE_CHIEF_IDS,
  EXECUTIVE_VISUAL_DEBATE_MISSION_IDS,
} from "../../runtime/executive-visual-debate/index.js";
import type { SupplierProductInput } from "../../runtime/commerce-intelligence-studio/models/commercial-review.js";

const WORKSPACE_ID = "ws-real-001";
const COMPANY_ID = "co-grand-king";

function sampleProduct(overrides: Partial<SupplierProductInput> = {}): SupplierProductInput {
  return {
    supplierProductId: "sup:real:001",
    supplierName: "CJdropshipping",
    title: "Premium Kitchen Organizer",
    description: "Space-saving kitchen organizer",
    category: "kitchen",
    costPrice: 12,
    suggestedRetailPrice: 34.99,
    imageUrls: ["https://example.com/img1.jpg", "https://example.com/img2.jpg"],
    attributes: { material: "Bamboo", size: "Medium" },
    tags: ["kitchen", "organizer"],
    ...overrides,
  };
}

describe("Global Commerce Execution Engine (REAL-003–REAL-007)", () => {
  beforeEach(() => {
    configureValidationEnvironment();
    resetDatabaseInstance();
    resetMarketplacePublishing();
    resetListingIntelligence();
    resetCommerceExecutionPipelines();
    initializeExecutiveRegistry(WORKSPACE_ID, COMPANY_ID);
  });

  afterEach(() => {
    resetMarketplacePublishing();
    resetListingIntelligence();
    resetCommerceExecutionPipelines();
    resetDatabaseInstance();
  });

  it("REAL-003 — marketplace publishing supports 7 adapters with governance gates", () => {
    assert.equal(MARKETPLACE_PUBLISH_IDS.length, 7);
    assert.equal(MARKETPLACE_ADAPTERS.length, 7);
    const pkg = buildMarketplaceListingPackage({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      productId: "prod-001",
      marketplaceId: "amazon",
      title: "Premium Kitchen Organizer",
      description: "Organize your kitchen efficiently",
      bulletPoints: ["Bamboo construction", "Easy install"],
      specifications: { material: "Bamboo" },
      price: 34.99,
      images: ["https://example.com/img1.jpg"],
      executiveCouncilApproved: false,
      kingApproved: false,
    });
    assert.equal(pkg.status, "PUBLISH_BLOCKED");
    assert.ok(pkg.blockers.some((b) => b.includes("Grand King")));
    assert.ok(pkg.blockers.some((b) => b.includes("Executive Council")));
    const queue = enqueueMarketplacePublish(pkg);
    assert.equal(queue.status, "BLOCKED");
  });

  it("REAL-003 — king + council approval still blocks live publish (architecture-only)", () => {
    const pkg = buildMarketplaceListingPackage({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      productId: "prod-002",
      marketplaceId: "shopify",
      title: "Shopify Product",
      description: "Test",
      bulletPoints: [],
      specifications: {},
      price: 29.99,
      images: ["https://example.com/img.jpg"],
      executiveCouncilApproved: true,
      kingApproved: true,
    });
    assert.ok(pkg.blockers.some((b) => b.includes("architecture-only") || b.includes("No execution bypass")));
  });

  it("REAL-004 — listing intelligence reuses CIS without duplicate intelligence", () => {
    const listing = buildListingIntelligence(WORKSPACE_ID, COMPANY_ID, sampleProduct());
    assert.ok(listing.title.length > 0);
    assert.ok(listing.reusedModules.includes("commerce-intelligence-studio"));
    assert.ok(listing.listingQualityScore >= 0);
    assert.equal(LISTING_INTELLIGENCE_MISSION_IDS[0], "REAL-004");
  });

  it("REAL-005 — product media recommendations without image AI", () => {
    const media = buildProductMediaIntelligence(WORKSPACE_ID, COMPANY_ID, sampleProduct({ imageUrls: [] }));
    assert.equal(media.architectureOnly, true);
    assert.ok(media.mediaGaps.length > 0);
    assert.ok(media.generationQueue.length > 0);
    assert.equal(PRODUCT_MEDIA_MISSION_IDS[0], "REAL-005");
  });

  it("REAL-006 — commerce execution pipeline tracks all 12 stages", () => {
    const pipeline = buildCommerceExecutionPipeline(
      WORKSPACE_ID,
      COMPANY_ID,
      sampleProduct(),
      "prod-pipeline-001",
    );
    assert.equal(pipeline.stages.length, COMMERCE_EXECUTION_STAGES.length);
    assert.ok(pipeline.architectureComplete);
    assert.ok(pipeline.revenueReadinessPercent >= 0);
    const kingStage = pipeline.stages.find((s) => s.stage === "GRAND_KING_APPROVAL");
    assert.equal(kingStage?.status, "BLOCKED");
  });

  it("REAL-007 — visual executive debate produces 12 chief cards + Soul synthesis", () => {
    const debate = buildExecutiveVisualDebate(WORKSPACE_ID, COMPANY_ID, {
      topic: "Launch first governed marketplace listing",
      subjectType: "marketplace",
      summary: "REAL-007 test debate for USD 100K path",
    });
    assert.equal(debate.chiefCards.length, VISUAL_DEBATE_CHIEF_IDS.length);
    assert.equal(debate.missionId, "REAL-007");
    assert.ok(debate.soulRecommendation.unifiedRecommendation.length > 0);
    assert.equal(debate.grandKingDecision.decision, "PENDING");
    const decided = recordGrandKingDecision(debate, "APPROVE", "Proceed with guardrails");
    assert.equal(decided.grandKingDecision.decision, "APPROVE");
    assert.equal(EXECUTIVE_VISUAL_DEBATE_MISSION_IDS[0], "REAL-007");
  });

  it("REAL-006 dashboard — global commerce execution aggregates REAL-003→REAL-007", () => {
    const dashboard = buildGlobalCommerceExecutionDashboard(WORKSPACE_ID, COMPANY_ID);
    assert.deepEqual([...dashboard.missionIds], [...GLOBAL_COMMERCE_EXECUTION_MISSION_IDS]);
    assert.equal(dashboard.marketplaceAdapterCount, 7);
    assert.equal(dashboard.executiveVisualDebate.chiefCards.length, 12);
    assert.equal(dashboard.governanceEnforced, true);
    assert.equal(dashboard.livePublishBlocked, true);
  });

  it("Brain tools registered for REAL-003→REAL-007 modules", () => {
    assert.ok(marketplacePublishingTools.some((t) => t.name === "marketplace_publishing.adapters"));
    assert.ok(listingIntelligenceTools.some((t) => t.name === "listing_intelligence.build"));
    assert.ok(productMediaTools.some((t) => t.name === "product_media.build"));
    assert.ok(commerceExecutionPipelineTools.some((t) => t.name === "commerce_execution_pipeline.dashboard"));
    assert.ok(executiveVisualDebateTools.some((t) => t.name === "executive_visual_debate.build"));
  });
});
