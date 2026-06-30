import { randomUUID } from "node:crypto";

import type { BrandGenesisInput } from "../../execution/brand-genesis/index.js";
import type { BrandProductPortfolioInput } from "../../execution/brand-product-portfolio/index.js";
import type { ProductOfferGenerationInput } from "../../execution/product-offer-generation/index.js";
import type { LandingPageBlueprintInput } from "../../execution/landing-page-blueprint/index.js";
import type { StorePipelineIds } from "./types.js";

export type DeterministicIdSet = Partial<StorePipelineIds> & {
  opportunityId?: string;
  portfolioEntryId?: string;
  allocationId?: string;
};

export const DEFAULT_M058_IDS: StorePipelineIds = {
  brandId: "00000000-0000-4000-a000-000000000046",
  offerId: "00000000-0000-4000-a000-000000000048",
  pageId: "00000000-0000-4000-a000-000000000049",
  storeId: "00000000-0000-4000-a000-000000000051",
  storefrontId: "00000000-0000-4000-a000-000000000053",
  generatedStorefrontId: "00000000-0000-4000-a000-000000000055",
  projectId: "00000000-0000-4000-a000-000000000056",
  productId: "prod-m058-kitchen-blender",
};

export function resolveIds(ids?: DeterministicIdSet): StorePipelineIds & {
  opportunityId: string;
  portfolioEntryId: string;
  allocationId: string;
} {
  return {
    brandId: ids?.brandId ?? randomUUID(),
    offerId: ids?.offerId ?? randomUUID(),
    pageId: ids?.pageId ?? randomUUID(),
    storeId: ids?.storeId ?? randomUUID(),
    storefrontId: ids?.storefrontId ?? randomUUID(),
    generatedStorefrontId: ids?.generatedStorefrontId ?? randomUUID(),
    projectId: ids?.projectId ?? randomUUID(),
    productId: ids?.productId ?? "prod-m058-kitchen-blender",
    opportunityId: ids?.opportunityId ?? randomUUID(),
    portfolioEntryId: ids?.portfolioEntryId ?? randomUUID(),
    allocationId: ids?.allocationId ?? randomUUID(),
  };
}

export function buildBrandGenesisInput(ids?: DeterministicIdSet): BrandGenesisInput {
  const resolved = resolveIds(ids);
  return {
    revenueOpportunity: {
      opportunityId: resolved.opportunityId,
      productId: resolved.productId,
      opportunityType: "DROPSHIPPING",
      confidence: 78,
      expectedValue: 82,
      expectedDifficulty: 38,
      recommendedAction:
        "Launch a low-budget dropshipping test on the highest-confidence marketplace channels",
      reasons: ["Strong buyer demand", "Good channel fit"],
    },
    portfolioEntry: {
      entryId: resolved.portfolioEntryId,
      revenueOpportunityId: resolved.opportunityId,
      productId: resolved.productId,
      state: "SCALING",
      portfolioScore: 84,
      capitalPriority: "HIGH",
    },
    capitalAllocation: {
      allocationId: resolved.allocationId,
      opportunityId: resolved.opportunityId,
      productId: resolved.productId,
      portfolioState: "SCALING",
      allocationPercentage: 42,
      riskAdjustedAllocation: 4200,
      confidence: 76,
    },
  };
}

export function buildPortfolioInput(
  brandId: string,
  productId: string,
  brandName: string,
): BrandProductPortfolioInput {
  const accessoryProductId = "prod-m058-blender-pitcher";

  return {
    brand: {
      brandId,
      productId,
      brandName,
      niche: "Curated ecommerce essentials",
      recommendedProducts: ["Kitchen Blender", "Starter bundle kit"],
      confidence: 80,
    },
    heroProduct: {
      id: productId,
      displayName: "Kitchen Blender",
      categoryId: "cat-kitchen-appliances",
      confidence: 84,
      tags: ["kitchen", "blender", "hero"],
    },
    relatedProducts: [
      {
        id: accessoryProductId,
        displayName: "Replacement Pitcher",
        categoryId: "cat-kitchen-accessories",
        confidence: 72,
        tags: ["accessory", "supporting"],
      },
    ],
    relationships: [
      {
        sourceProductId: productId,
        targetProductId: accessoryProductId,
        relationshipType: "complementary",
        strength: 78,
      },
    ],
    opportunities: [
      {
        productId,
        opportunityScore: 86,
        opportunityTier: "high",
        confidence: 82,
        strengths: ["Strong buyer demand"],
      },
      {
        productId: accessoryProductId,
        opportunityScore: 68,
        opportunityTier: "medium",
        confidence: 70,
        strengths: ["High attach rate"],
      },
    ],
    supplierMatches: [
      {
        productId,
        matchScore: 84,
        matchTier: "high",
        confidence: 80,
        recommendedUse: "primary fulfillment partner",
      },
      {
        productId: accessoryProductId,
        matchScore: 72,
        matchTier: "medium",
        confidence: 68,
        recommendedUse: "accessory fulfillment",
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
      confidence: 82,
    },
    brandProduct: {
      productId,
      displayName: "Kitchen Blender",
      role: "HERO",
      productScore: 84,
      opportunityScore: 86,
      supplierMatchScore: 80,
    },
    productEntity: {
      id: productId,
      displayName: "Kitchen Blender",
      description: "High-performance kitchen blender for everyday use",
      categoryId: "cat-kitchen-appliances",
      confidence: 83,
      tags: ["kitchen", "blender", "hero"],
    },
    portfolioConfidence: 78,
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
        "Online shoppers seeking fast, reliable product discovery get a polished, high-confidence purchase they feel proud to own",
      callToAction: "Shop the premium offer",
      confidence: 82,
    },
    brand: {
      brandId,
      brandName,
      slogan: "Quality you can ship today",
      niche: "Curated ecommerce essentials",
      targetAudience: "Online shoppers seeking fast, reliable product discovery",
      positioning:
        "Trusted direct-to-consumer category leader ready to scale in curated ecommerce essentials",
      confidence: 80,
    },
  };
}
