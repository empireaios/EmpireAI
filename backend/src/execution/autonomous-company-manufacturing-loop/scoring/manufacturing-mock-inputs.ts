import { randomUUID } from "node:crypto";

import type { BrandGenesisInput } from "../../brand-genesis/index.js";
import type { BrandProductPortfolioInput } from "../../brand-product-portfolio/index.js";
import type { ProductOfferGenerationInput } from "../../product-offer-generation/index.js";
import type { LandingPageBlueprintInput } from "../../landing-page-blueprint/index.js";

export type ManufacturingPipelineIds = {
  brandId: string;
  offerId: string;
  pageId: string;
  storeId: string;
  storefrontId: string;
  generatedStorefrontId: string;
  projectId: string;
  productId: string;
  opportunityId: string;
  portfolioEntryId: string;
  allocationId: string;
};

export type DeterministicManufacturingIdSet = Partial<ManufacturingPipelineIds>;

export const DEFAULT_M072_IDS: ManufacturingPipelineIds = {
  brandId: "00000000-0000-4000-a000-000000000072",
  offerId: "00000000-0000-4000-a000-000000000048",
  pageId: "00000000-0000-4000-a000-000000000049",
  storeId: "00000000-0000-4000-a000-000000000051",
  storefrontId: "00000000-0000-4000-a000-000000000053",
  generatedStorefrontId: "00000000-0000-4000-a000-000000000055",
  projectId: "00000000-0000-4000-a000-000000000056",
  productId: "prod-m072-kitchen-blender",
  opportunityId: "00000000-0000-4000-a000-000000000043",
  portfolioEntryId: "00000000-0000-4000-a000-000000000044",
  allocationId: "00000000-0000-4000-a000-000000000045",
};

export function resolveManufacturingIds(
  ids?: DeterministicManufacturingIdSet,
): ManufacturingPipelineIds {
  return {
    brandId: ids?.brandId ?? randomUUID(),
    offerId: ids?.offerId ?? randomUUID(),
    pageId: ids?.pageId ?? randomUUID(),
    storeId: ids?.storeId ?? randomUUID(),
    storefrontId: ids?.storefrontId ?? randomUUID(),
    generatedStorefrontId: ids?.generatedStorefrontId ?? randomUUID(),
    projectId: ids?.projectId ?? randomUUID(),
    productId: ids?.productId ?? "prod-m072-kitchen-blender",
    opportunityId: ids?.opportunityId ?? randomUUID(),
    portfolioEntryId: ids?.portfolioEntryId ?? randomUUID(),
    allocationId: ids?.allocationId ?? randomUUID(),
  };
}

export function buildBrandGenesisInput(ids?: DeterministicManufacturingIdSet): BrandGenesisInput {
  const resolved = resolveManufacturingIds(ids);
  return {
    revenueOpportunity: {
      opportunityId: resolved.opportunityId,
      productId: resolved.productId,
      opportunityType: "DROPSHIPPING",
      confidence: 82,
      expectedValue: 88,
      expectedDifficulty: 35,
      recommendedAction:
        "Launch a low-budget dropshipping test on the highest-confidence marketplace channels",
      reasons: ["Strong buyer demand", "Good channel fit", "Rising trend signals"],
    },
    portfolioEntry: {
      entryId: resolved.portfolioEntryId,
      revenueOpportunityId: resolved.opportunityId,
      productId: resolved.productId,
      state: "SCALING",
      portfolioScore: 86,
      capitalPriority: "HIGH",
    },
    capitalAllocation: {
      allocationId: resolved.allocationId,
      opportunityId: resolved.opportunityId,
      productId: resolved.productId,
      portfolioState: "SCALING",
      allocationPercentage: 45,
      riskAdjustedAllocation: 4500,
      confidence: 80,
    },
  };
}

export function buildPortfolioInput(
  brandId: string,
  productId: string,
  brandName: string,
): BrandProductPortfolioInput {
  const accessoryProductId = "prod-m072-blender-pitcher";

  return {
    brand: {
      brandId,
      productId,
      brandName,
      niche: "Curated ecommerce essentials",
      recommendedProducts: ["Kitchen Blender", "Starter bundle kit"],
      confidence: 82,
    },
    heroProduct: {
      id: productId,
      displayName: "Kitchen Blender",
      categoryId: "cat-kitchen-appliances",
      confidence: 86,
      tags: ["kitchen", "blender", "hero"],
    },
    relatedProducts: [
      {
        id: accessoryProductId,
        displayName: "Replacement Pitcher",
        categoryId: "cat-kitchen-accessories",
        confidence: 74,
        tags: ["accessory", "supporting"],
      },
    ],
    relationships: [
      {
        sourceProductId: productId,
        targetProductId: accessoryProductId,
        relationshipType: "complementary",
        strength: 80,
      },
    ],
    opportunities: [
      {
        productId,
        opportunityScore: 88,
        opportunityTier: "high",
        confidence: 84,
        strengths: ["Strong buyer demand"],
      },
    ],
    supplierMatches: [
      {
        productId,
        matchScore: 86,
        matchTier: "high",
        confidence: 82,
        recommendedUse: "primary fulfillment partner",
      },
    ],
  };
}

export function buildOfferInput(
  brandId: string,
  productId: string,
  brandName: string,
  valueProposition: string,
): ProductOfferGenerationInput {
  return {
    brand: {
      brandId,
      brandName,
      slogan: "Quality you can ship today",
      niche: "Curated ecommerce essentials",
      targetAudience: "Online shoppers seeking fast, reliable product discovery",
      valueProposition,
      confidence: 84,
    },
    brandProduct: {
      productId,
      displayName: "Kitchen Blender",
      role: "HERO",
      productScore: 86,
      opportunityScore: 88,
      supplierMatchScore: 84,
    },
    productEntity: {
      id: productId,
      displayName: "Kitchen Blender",
      description: "High-performance kitchen blender for everyday use",
      categoryId: "cat-kitchen-appliances",
      confidence: 85,
      tags: ["kitchen", "blender", "hero"],
    },
    portfolioConfidence: 82,
  };
}

export function buildLandingBlueprintInput(
  brandId: string,
  offerId: string,
  productId: string,
  brandName: string,
  valueProposition: string,
): LandingPageBlueprintInput {
  return {
    offer: {
      offerId,
      brandId,
      productId,
      offerStyle: "PREMIUM",
      offerTitle: "Premium Kitchen Blender Offer",
      headline: `Elevate your kitchen blender experience with ${brandName}.`,
      valueProposition,
      keyBenefits: [
        "Premium positioning buyers trust immediately",
        "Higher perceived quality and brand credibility",
        "Stronger conversion for high-intent shoppers",
      ],
      keyFeatures: [
        "High-performance kitchen blender for everyday use",
        "Curated premium presentation",
        "Brand-backed quality promise",
      ],
      customerProblem:
        "Buyers in curated ecommerce essentials struggle to find products that feel premium and trustworthy",
      customerOutcome:
        "Online shoppers get a polished, high-confidence purchase they feel proud to own",
      callToAction: "Shop the premium offer",
      confidence: 84,
    },
    brand: {
      brandId,
      brandName,
      slogan: "Quality you can ship today",
      niche: "Curated ecommerce essentials",
      targetAudience: "Online shoppers seeking fast, reliable product discovery",
      positioning: "Trusted direct-to-consumer category leader ready to scale",
      confidence: 82,
    },
  };
}

export function buildEyeSynthesisInput(productId: string) {
  return {
    productId,
    opportunity: {
      productId,
      opportunityScore: 84,
      opportunityTier: "high" as const,
      confidence: 80,
      strengths: ["Strong buyer demand", "Good channel fit"],
      weaknesses: ["Moderate competition"],
      recommendedChannels: ["Amazon", "Google Search", "TikTok"],
    },
    launch: {
      productId,
      decision: "LAUNCH" as const,
      launchScore: 78,
      confidence: 76,
      reasons: ["Strong launch readiness", "Rising trend signals"],
      risks: ["Competition pressure"],
      recommendedChannels: ["Amazon", "Google Search"],
      expectedOutcome: "High launch potential with strong demand signals",
    },
    forecast: {
      productId,
      forecastDirection: "RISING" as const,
      forecastConfidence: 74,
      momentumProjection: 72,
      riskProjection: 38,
      opportunityProjection: 80,
      recommendedAction: "ACCUMULATE" as const,
    },
    trustProfiles: [
      {
        source: "AMAZON" as const,
        trustScore: 78,
        trustTier: "MEDIUM_TRUST" as const,
        manipulationRisk: 16,
        noiseLevel: 20,
      },
    ],
    learning: {
      productId,
      executionStatus: "COMPLETED" as const,
      confidenceAdjustment: {
        baseConfidence: 74,
        adjustedConfidence: 80,
        delta: 6,
        reason: "Completed investigation improved confidence",
      },
      investigationRecommendations: [],
      repeatedFailures: [],
      repeatedSuccesses: [],
    },
  };
}
