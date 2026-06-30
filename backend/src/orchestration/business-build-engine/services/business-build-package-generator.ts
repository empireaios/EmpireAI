import { randomUUID } from "node:crypto";

import { evaluateSupplier } from "../../../intelligence/supplier-intelligence-engine/index.js";
import type { BusinessOpportunityRecord } from "../../business-opportunity-workspace/models/business-opportunity.js";
import type { BusinessPreviewRecord } from "../../business-preview-studio/models/business-preview.js";
import type { MarketDominationStrategyDocument } from "../../market-domination-strategy-engine/models/market-domination-strategy.js";
import { getCommerceReadinessSummary } from "../../commerce-readiness-engine/index.js";
import type {
  BrandBuildAssets,
  BuildMarketplaceId,
  BuildValidationResult,
  BusinessBuildPackage,
  MarketplacePublicationPackage,
  ProductBuildAssets,
  SeoBuildAssets,
  SupplierBuildPackage,
  VideoBuildAssets,
  VisualBuildAssets,
} from "../models/business-build-package.js";
import { BUILD_MARKETPLACES } from "../models/business-build-package.js";

const MARKETPLACE_CATEGORY_PATHS: Record<BuildMarketplaceId, string> = {
  amazon: "Home & Kitchen > Kitchen & Dining",
  shopify: "Collections > Featured",
  "tiktok-shop": "Home > Kitchen",
  ebay: "Home & Garden > Kitchen",
  "google-merchant": "Home & Garden > Kitchen & Dining",
};

function buildBrandAssets(
  opportunity: BusinessOpportunityRecord,
  preview: BusinessPreviewRecord,
  strategy: MarketDominationStrategyDocument,
): BrandBuildAssets {
  return {
    finalBrandName: opportunity.brand.businessName,
    logo: preview.brandPreview.logo.replace("preview://", "build://"),
    colourPalette: preview.brandPreview.colourPalette,
    typography: preview.brandPreview.typography,
    brandGuidelines: `Use ${preview.brandPreview.typography.headingFont} for headings, ${preview.brandPreview.colourPalette.primary} as primary. Maintain ${strategy.identity.brandPosition} positioning.`,
    brandStory: strategy.identity.brandPromise,
    brandVoice: `Confident, trustworthy, ${opportunity.brand.category}-focused — ${strategy.identity.coreValueProposition}`,
  };
}

function buildProductAssets(
  opportunity: BusinessOpportunityRecord,
  preview: BusinessPreviewRecord,
  strategy: MarketDominationStrategyDocument,
): ProductBuildAssets {
  const productName = opportunity.economics.productName;
  return {
    productTitle: preview.productPreview.productTitle,
    productSubtitle: `${productName} — ${strategy.identity.targetCustomer}`,
    productDescription: preview.productPreview.productDescription,
    productSpecifications: [
      `Category: ${opportunity.brand.category}`,
      `Supplier: ${opportunity.economics.supplier}`,
      `Primary marketplace: ${strategy.battlefield.primaryMarketplace}`,
    ],
    productFeatures: strategy.competitiveAdvantages.slice(0, 4).map((entry) => entry.name),
    productBenefits: strategy.customerPsychology.buyingMotivations,
    faq: strategy.customerPsychology.objections.map((question, index) => ({
      question,
      answer: strategy.customerPsychology.recommendedResponses[index] ??
        strategy.customerPsychology.recommendedResponses[0] ??
        "Contact support for details.",
    })),
  };
}

function buildVisualAssets(preview: BusinessPreviewRecord, opportunity: BusinessOpportunityRecord): VisualBuildAssets {
  const slug = opportunity.economics.productName.toLowerCase().replace(/\s+/g, "-");
  const gallery = preview.productPreview.productGallery.map((url) => url.replace("preview://", "build://"));
  return {
    heroImage: preview.productPreview.heroBanner.replace("preview://", "build://"),
    productGallery: gallery,
    lifestyleImages: [
      `build://lifestyle/${slug}/in-use`,
      `build://lifestyle/${slug}/context`,
    ],
    infographics: [`build://infographic/${slug}/features`, `build://infographic/${slug}/benefits`],
    packagingMockup: preview.productPreview.packagingConcept.replace("preview://", "build://"),
    thumbnailImages: gallery.slice(0, 3).map((url) => url.replace("gallery", "thumbnail")),
  };
}

function buildVideoAssets(preview: BusinessPreviewRecord, strategy: MarketDominationStrategyDocument): VideoBuildAssets {
  const storyboard = preview.productPreview.productVideoStoryboard;
  return {
    shortFormVideo: "build-spec://video/short-form — 15-30s vertical hook + product demo",
    productDemonstration: "build-spec://video/demo — 60s feature walkthrough with brand overlay",
    ugcStyleVideo: "build-spec://video/ugc — authentic unboxing and first-use reaction format",
    storyboard,
    shotList: storyboard.map((scene, index) => `Shot ${index + 1}: ${scene}`),
    captionSuggestions: [
      strategy.identity.coreValueProposition,
      ...strategy.customerPsychology.purchaseTriggers.slice(0, 2),
    ],
  };
}

function buildSeoAssets(preview: BusinessPreviewRecord, strategy: MarketDominationStrategyDocument): SeoBuildAssets {
  return {
    seoTitle: preview.productPreview.seoTitle,
    seoDescription: preview.productPreview.productDescription.slice(0, 160),
    seoKeywords: preview.productPreview.seoKeywords,
    structuredMetadata: {
      "@type": "Product",
      name: preview.productPreview.productTitle,
      brand: strategy.identity.brandPosition,
      category: strategy.battlefield.primaryMarketplace,
    },
    marketplaceSearchTerms: [
      ...preview.productPreview.seoKeywords,
      ...strategy.battlefield.marketGaps.slice(0, 2),
    ],
  };
}

function buildMarketplacePackages(
  opportunity: BusinessOpportunityRecord,
  preview: BusinessPreviewRecord,
  strategy: MarketDominationStrategyDocument,
  visual: VisualBuildAssets,
  price: number,
): MarketplacePublicationPackage[] {
  return BUILD_MARKETPLACES.map((marketplaceId) => {
    const strategyEntry = strategy.marketplaceStrategy.find((entry) => entry.marketplaceId === marketplaceId);
    const bullets = strategy.competitiveAdvantages.slice(0, 5).map((entry) => `${entry.name}: ${entry.rationale.slice(0, 80)}`);

    return {
      marketplaceId,
      title: preview.productPreview.productTitle,
      description: preview.productPreview.productDescription,
      bulletPoints: bullets.length > 0 ? bullets : [preview.productPreview.productDescription],
      searchTerms: preview.productPreview.seoKeywords,
      categoryPath: MARKETPLACE_CATEGORY_PATHS[marketplaceId],
      price,
      images: [visual.heroImage, ...visual.productGallery.slice(0, 4)],
      ready: (strategyEntry?.confidence ?? 60) >= 55,
      publishBlocked: true as const,
    };
  });
}

function buildSupplierPackage(opportunity: BusinessOpportunityRecord): SupplierBuildPackage {
  let confidence = opportunity.economics.supplierConfidence;
  try {
    const evaluation = evaluateSupplier({
      workspaceId: opportunity.workspaceId,
      supplierId: opportunity.economics.supplier,
    });
    confidence = Math.round(evaluation.reliabilityScore ?? evaluation.trustScore ?? confidence);
  } catch {
    // use discovery confidence
  }

  const slug = opportunity.economics.productId.replace(/[^a-zA-Z0-9-]/g, "-");
  return {
    supplierMapping: {
      supplierId: opportunity.economics.supplier,
      supplierName: opportunity.economics.supplier,
      productId: opportunity.economics.productId,
      confidence,
    },
    skuMapping: {
      internalSku: `sku:${slug}`,
      supplierSku: opportunity.economics.productId,
      variantLabel: "Default",
    },
    shippingRules: [
      `Standard shipping — confidence ${opportunity.economics.shippingEstimate}/100`,
      "No expedited until supplier reliability verified",
    ],
    fulfillmentNotes: [
      "Dropship fulfillment — no warehouse execution in build phase",
      `Target margin ${opportunity.economics.estimatedMargin}% maintained`,
    ],
    qualityRequirements: [
      "Inspect product images match supplier catalog",
      "Verify packaging mockup aligns with brand guidelines",
      `Minimum supplier confidence: 60 (current: ${confidence})`,
    ],
    ready: confidence >= 60,
    executionBlocked: true as const,
  };
}

function validateBuildPackage(pkg: Omit<BusinessBuildPackage, "validation" | "buildProgress">): BuildValidationResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  let assetsCompleted = 0;
  const assetsRequired = 6;

  if (pkg.brandAssets.finalBrandName) assetsCompleted++;
  if (pkg.productAssets.productTitle) assetsCompleted++;
  if (pkg.visualAssets.heroImage) assetsCompleted++;
  if (pkg.videoAssets.storyboard.length > 0) assetsCompleted++;
  if (pkg.seoAssets.seoTitle) assetsCompleted++;
  if (pkg.supplierPackage.ready) assetsCompleted++;

  const marketplacePackagesReady = pkg.marketplacePackages.filter((entry) => entry.ready).length;

  if (!pkg.supplierPackage.ready) {
    blockers.push("Supplier package not ready — confidence below threshold.");
  }
  if (marketplacePackagesReady < 3) {
    warnings.push("Fewer than 3 marketplace packages meet readiness threshold.");
  }

  const readiness = getCommerceReadinessSummary({
    workspaceId: pkg.workspaceId,
    companyId: pkg.companyId,
    accountType: "grand_king",
  });

  const publicationReadiness = Math.round(
    (assetsCompleted / assetsRequired) * 40 +
      (marketplacePackagesReady / 5) * 30 +
      (pkg.supplierPackage.ready ? 20 : 0) +
      readiness.overallReadinessScore * 0.1,
  );

  return {
    valid: blockers.length === 0 && assetsCompleted >= assetsRequired,
    assetsCompleted,
    assetsRequired,
    marketplacePackagesReady,
    supplierReady: pkg.supplierPackage.ready,
    publicationReadiness: Math.min(100, publicationReadiness),
    blockers,
    warnings,
  };
}

/** Assembles complete business build package — construction only, no publishing. */
export function assembleBusinessBuildPackage(input: {
  opportunity: BusinessOpportunityRecord;
  preview: BusinessPreviewRecord;
  strategy: MarketDominationStrategyDocument;
}): BusinessBuildPackage {
  const { opportunity, preview, strategy } = input;
  const timestamp = new Date().toISOString();
  const price = strategy.pricingStrategy.launchPrice;

  const brandAssets = buildBrandAssets(opportunity, preview, strategy);
  const productAssets = buildProductAssets(opportunity, preview, strategy);
  const visualAssets = buildVisualAssets(preview, opportunity);
  const videoAssets = buildVideoAssets(preview, strategy);
  const seoAssets = buildSeoAssets(preview, strategy);
  const marketplacePackages = buildMarketplacePackages(opportunity, preview, strategy, visualAssets, price);
  const supplierPackage = buildSupplierPackage(opportunity);

  const partial = {
    buildId: `build:${randomUUID()}`,
    businessOpportunityId: opportunity.businessOpportunityId,
    previewId: preview.previewId,
    strategyId: strategy.strategyId,
    workspaceId: opportunity.workspaceId,
    companyId: opportunity.companyId,
    businessName: opportunity.brand.businessName,
    status: "BUILDING" as const,
    brandAssets,
    productAssets,
    visualAssets,
    videoAssets,
    seoAssets,
    marketplacePackages,
    supplierPackage,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const validation = validateBuildPackage(partial);
  const buildProgress = Math.round(
    (validation.assetsCompleted / validation.assetsRequired) * 70 +
      (validation.marketplacePackagesReady / 5) * 20 +
      (validation.supplierReady ? 10 : 0),
  );

  return {
    ...partial,
    status: validation.valid ? "READY_FOR_PUBLICATION" : "BUILDING",
    validation,
    buildProgress: Math.min(100, buildProgress),
    completedAt: validation.valid ? timestamp : undefined,
  };
}

export { validateBuildPackage };
