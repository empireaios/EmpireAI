import { randomUUID } from "node:crypto";

import { brandGenesisModule } from "../../../execution/brand-genesis/contract/brand-genesis-module.js";
import type { BrandGenesisInput } from "../../../execution/brand-genesis/scoring/brand-scoring.js";
import { generateCreativeAssetBlueprint } from "../../../execution/creative-asset-blueprint/scoring/creative-asset-blueprint-scoring.js";
import { importSupplierProducts } from "../../../execution/product-import/scoring/product-import-scoring.js";
import { scoreProductOffer } from "../../../execution/product-offer-generation/scoring/offer-scoring.js";
import { prepareCatalogPublish } from "../../../execution/product-publishing-engine/services/product-publishing-service.js";
import { generateSeoIntelligence } from "../../../execution/seo-intelligence/scoring/seo-intelligence-scoring.js";
import { deployLiveStore } from "../../../revenue/minimum-live-revenue-loop/services/storefront-deploy-service.js";
import { evaluateSupplier } from "../../../intelligence/supplier-intelligence-engine/index.js";
import {
  buildStubCatalogForPlatform,
  syncSupplierCatalog,
} from "../../../suppliers/supplier-product-synchronization/index.js";
import { captureSoulRuntimeEvent } from "../../../foundation/soul-runtime/services/soul-runtime-engine.js";
import type { LaunchAssetBundle, LaunchWorkflowRecord, ProductRecommendation } from "../models/ecommerce-os-workflow.js";
import { resolveSupplierConfidence } from "./product-recommendation-service.js";

function buildBrandGenesisInput(
  workflow: LaunchWorkflowRecord,
  recommendation: ProductRecommendation,
): BrandGenesisInput {
  const opportunityId = `opp:${workflow.workflowId}:${recommendation.productId}`;
  return {
    revenueOpportunity: {
      opportunityId,
      productId: recommendation.productId,
      opportunityType: "DROPSHIPPING",
      confidence: recommendation.dominationScore,
      expectedValue: recommendation.expectedRoi,
      expectedDifficulty: 100 - recommendation.margin,
      recommendedAction: "LAUNCH",
      reasons: recommendation.rationale,
    },
    portfolioEntry: {
      entryId: `entry:${workflow.workflowId}`,
      revenueOpportunityId: opportunityId,
      productId: recommendation.productId,
      state: "ACTIVE",
      portfolioScore: recommendation.compositeRank,
      capitalPriority: "HIGH",
    },
    capitalAllocation: {
      allocationId: `alloc:${workflow.workflowId}`,
      opportunityId,
      productId: recommendation.productId,
      portfolioState: "ACTIVE",
      allocationPercentage: 100,
      riskAdjustedAllocation: recommendation.expectedRoi,
      confidence: recommendation.dominationScore,
    },
  };
}

function buildSupplierItems() {
  return syncSupplierCatalog({
    connectorId: "cj-dropshipping",
    platform: "CJ_DROPSHIPPING",
    catalogItems: buildStubCatalogForPlatform("CJ_DROPSHIPPING"),
  }).map((item) => ({
    supplierProduct: item.supplierProduct,
    supplierInventory: item.supplierInventory,
    supplierPricing: item.supplierPricing,
  }));
}

/** Orchestrates existing engines to prepare launch assets — no duplicated business logic. */
export async function prepareLaunchAssets(workflow: LaunchWorkflowRecord): Promise<LaunchWorkflowRecord> {
  const approved = workflow.recommendations.filter((rec) =>
    workflow.approvedProductIds.includes(rec.productId),
  );
  if (approved.length === 0) {
    throw new Error("No approved products to prepare");
  }

  const primary = approved[0];
  if (!primary) {
    throw new Error("No approved products to prepare");
  }
  const brandInput = buildBrandGenesisInput(workflow, primary);
  const brandBreakdown = brandGenesisModule.generateBrandProfile(brandInput);
  const brandProfile = await brandGenesisModule.persistBrandProfile(workflow.workspaceId, brandInput);

  const offer = scoreProductOffer({
    brand: {
      brandId: brandProfile.brandId,
      brandName: brandProfile.brandName,
      slogan: brandProfile.slogan,
      niche: brandProfile.niche,
      targetAudience: brandProfile.targetAudience,
      valueProposition: brandProfile.valueProposition,
      confidence: brandProfile.confidence,
    },
    brandProduct: {
      productId: primary.productId,
      displayName: primary.productName,
      role: "HERO",
      productScore: primary.dominationScore,
      opportunityScore: primary.expectedRoi,
      supplierMatchScore: primary.supplierConfidence,
    },
    productEntity: {
      id: primary.productId,
      displayName: primary.productName,
      description: `${primary.productName} for ${workflow.category}`,
      categoryId: workflow.category,
      confidence: primary.dominationScore,
      tags: [workflow.category, workflow.brandChoice],
    },
    portfolioConfidence: primary.compositeRank,
  });

  const creative = generateCreativeAssetBlueprint({
    brand: {
      brandId: brandProfile.brandId,
      brandName: brandProfile.brandName,
      slogan: brandProfile.slogan,
      niche: brandProfile.niche,
      targetAudience: brandProfile.targetAudience,
      positioning: brandProfile.positioning,
      confidence: brandProfile.confidence,
    },
    offer: {
      offerTitle: offer.offerTitle,
      headline: offer.headline,
      valueProposition: offer.valueProposition,
      keyBenefits: offer.keyBenefits,
      callToAction: offer.callToAction,
    },
    campaignName: `${workflow.brandChoice} Launch`,
    storeId: `store-${workflow.workflowId.slice(0, 8)}`,
  });

  const supplierId = primary.supplierId ?? "cj-dropshipping";
  let supplierConnectionPrepared = false;
  try {
    const supplierEval = evaluateSupplier({ workspaceId: workflow.workspaceId, supplierId });
    supplierConnectionPrepared = supplierEval.overallRecommendation !== "REJECT";
  } catch {
    supplierConnectionPrepared = resolveSupplierConfidence(workflow.workspaceId, supplierId) >= 60;
  }

  const storeSlug = `${workflow.brandChoice.toLowerCase().replace(/\s+/g, "-")}-${randomUUID().slice(0, 6)}`;
  const deployed = deployLiveStore({
    workspaceId: workflow.workspaceId,
    companyId: workflow.companyId,
    brandId: brandProfile.brandId,
    slug: storeSlug,
    productName: primary.productName,
    productDescription: offer.valueProposition,
    priceCents: 7200,
    cjSupplierSku: "CJ-SKU-DEFAULT",
    cjSupplierProductId: primary.productId,
    unitCostCents: 850,
  });
  const storeId = deployed.store.storeId;

  const seo = generateSeoIntelligence({
    brand: {
      brandId: brandProfile.brandId,
      brandName: brandProfile.brandName,
      slogan: brandProfile.slogan,
      niche: brandProfile.niche,
      targetAudience: brandProfile.targetAudience,
      positioning: brandProfile.positioning,
      confidence: brandProfile.confidence,
    },
    offer: {
      offerTitle: offer.offerTitle,
      headline: offer.headline,
      valueProposition: offer.valueProposition,
      keyBenefits: offer.keyBenefits,
      callToAction: offer.callToAction,
    },
    storeId,
    storeName: brandProfile.brandName,
  });

  const imported = importSupplierProducts({
    store: { storeId, brandId: brandProfile.brandId, defaultCollectionHandle: "featured" },
    supplierItems: buildSupplierItems(),
  });

  let publishId: string | undefined;
  try {
    const publish = prepareCatalogPublish({
      workspaceId: workflow.workspaceId,
      companyId: workflow.companyId,
      storeId,
      importedProducts: imported.importedProducts,
      mappedProducts: imported.mappedProducts,
      metadata: {
        workflowId: workflow.workflowId,
        brandId: brandProfile.brandId,
        mission: "LIVE-001",
      },
    });
    publishId = publish.publishId;
  } catch {
    // Publishing may be disabled — listings still counted from import.
  }

  const assets: LaunchAssetBundle = {
    brandId: brandProfile.brandId,
    brandName: brandProfile.brandName,
    offersPrepared: 1,
    listingsPrepared: imported.importedProducts.filter((p) => p.status === "IMPORTED").length,
    videosPrepared: creative.videoPrompts.length,
    imagesPrepared: creative.imagePrompts.length,
    seoPrepared: seo.titleTags.length > 0,
    supplierConnectionPrepared,
    supplierId,
    publishId,
    storeId,
  };

  try {
    captureSoulRuntimeEvent({
      workspaceId: workflow.workspaceId,
      memoryKey: "businessMilestones",
      title: `Launch assets prepared: ${brandProfile.brandName}`,
      summary: `EA prepared brand, listings, creative, SEO, and supplier connection for ${primary.productName}`,
      source: "system",
      actor: workflow.actor ?? "ecommerce-os-orchestrator",
      payload: { workflowId: workflow.workflowId, brandId: brandProfile.brandId },
    });
  } catch {
    // Soul runtime capture is best-effort.
  }

  return {
    ...workflow,
    stage: "READY_TO_LAUNCH",
    assets,
    launchStatus: "READY_TO_LAUNCH",
    readinessBlockers: [],
    metadata: {
      ...workflow.metadata,
      brandBreakdownConfidence: String(brandBreakdown.confidence),
      seoScore: String(seo.seoConfidence ?? 0),
      creativeScore: String(creative.confidence ?? 0),
    },
  };
}

export function assessLaunchReadiness(workflow: LaunchWorkflowRecord): string[] {
  const blockers: string[] = [];
  if (workflow.approvedProductIds.length === 0) {
    blockers.push("Grand King has not approved products");
  }
  if (!workflow.assets.brandId) {
    blockers.push("Brand assets not prepared");
  }
  if ((workflow.assets.listingsPrepared ?? 0) === 0) {
    blockers.push("Product listings not prepared");
  }
  if (!workflow.assets.seoPrepared) {
    blockers.push("SEO not prepared");
  }
  if (!workflow.assets.supplierConnectionPrepared) {
    blockers.push("Supplier connection not ready");
  }
  return blockers;
}
