import type { MarketplaceId } from "../../marketplace-infrastructure-engine/models/marketplace-connection.js";
import { getMarketplacePublishingReadiness } from "../../marketplace-connection-engine/index.js";
import type { ProductDiscoveryInput, MarketplaceRecommendation } from "../models/product-opportunity.js";

const CATEGORY_MARKETPLACE_MAP: Record<string, MarketplaceId[]> = {
  kitchen: ["amazon", "walmart", "shopify"],
  health: ["amazon", "google-merchant", "shopify"],
  beauty: ["tiktok-shop", "instagram-shop", "amazon"],
  fitness: ["amazon", "tiktok-shop", "shopify"],
  home: ["amazon", "walmart", "ebay"],
  electronics: ["amazon", "ebay", "google-merchant"],
  pet: ["amazon", "shopify", "ebay"],
};

const DEFAULT_MARKETPLACES: MarketplaceId[] = ["amazon", "shopify", "google-merchant"];

function categoryCandidates(category: string): MarketplaceId[] {
  const key = category.toLowerCase();
  return CATEGORY_MARKETPLACE_MAP[key] ?? DEFAULT_MARKETPLACES;
}

/** Marketplace recommendations — delegates readiness to Marketplace Connection Engine. */
export function recommendMarketplaces(
  input: Pick<ProductDiscoveryInput, "workspaceId" | "category" | "targetMarket"> & {
    dominationScore: number;
    brandingPotential: number;
    competitionEstimate: number;
  },
): MarketplaceRecommendation {
  const readiness = getMarketplacePublishingReadiness(input.workspaceId, "GRAND_KING");
  const readySet = new Set(readiness.readyMarketplaces);
  const candidates = categoryCandidates(input.category);

  const ranked = candidates
    .map((marketplaceId) => {
      let score = 50;
      if (readySet.has(marketplaceId)) score += 30;
      if (marketplaceId === "amazon") score += 10;
      if (marketplaceId === "tiktok-shop" && input.brandingPotential >= 70) score += 15;
      if (marketplaceId === "google-merchant" && input.competitionEstimate >= 60) score += 10;
      if (marketplaceId === "shopify") score += 5;
      return { marketplaceId, score };
    })
    .sort((a, b) => b.score - a.score);

  const primaryMarketplace = ranked[0]?.marketplaceId ?? "amazon";
  const secondaryMarketplace = ranked[1]?.marketplaceId;
  const futureExpansionMarketplaces = ranked.slice(2).map((entry) => entry.marketplaceId);

  const reasoning = [
    `Category "${input.category}" aligns with ${primaryMarketplace} as primary channel.`,
    `Target market ${input.targetMarket} evaluated against connected marketplaces.`,
  ];
  if (readySet.has(primaryMarketplace)) {
    reasoning.push(`${primaryMarketplace} is connected and publishing-ready.`);
  } else {
    reasoning.push(`${primaryMarketplace} recommended but requires marketplace connection before build.`);
  }
  if (input.dominationScore >= 75) {
    reasoning.push("High domination score supports aggressive marketplace expansion.");
  }

  return {
    primaryMarketplace,
    secondaryMarketplace,
    futureExpansionMarketplaces,
    reasoning,
  };
}

export function computeMarketplaceSuitability(
  recommendation: MarketplaceRecommendation,
  workspaceId: string,
): number {
  const readiness = getMarketplacePublishingReadiness(workspaceId, "GRAND_KING");
  let score = 55;
  if (readiness.readyMarketplaces.includes(recommendation.primaryMarketplace)) {
    score += 25;
  }
  if (
    recommendation.secondaryMarketplace &&
    readiness.readyMarketplaces.includes(recommendation.secondaryMarketplace)
  ) {
    score += 10;
  }
  score += Math.min(15, recommendation.futureExpansionMarketplaces.length * 5);
  return Math.min(100, score);
}
