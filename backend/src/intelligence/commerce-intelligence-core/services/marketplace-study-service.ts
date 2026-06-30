import type { MarketplaceStudy, ProductCandidate } from "../models/commerce-intelligence-core.js";

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function hashSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function densityLabel(score: number): "low" | "medium" | "high" {
  if (score >= 67) return "high";
  if (score >= 40) return "medium";
  return "low";
}

/** Amazon US marketplace fit study — Pillow-owned intelligence subsystem. */
export function studyAmazonMarketplace(candidate: ProductCandidate): MarketplaceStudy {
  const seed = hashSeed(`${candidate.supplierProductId}:${candidate.category}`);
  const cost = candidate.supplierCostUsd;
  const marginMultiplier = 1.8 + (seed % 15) / 10;
  const minPrice = Math.round(cost * marginMultiplier * 100) / 100;
  const maxPrice = Math.round(minPrice * (1.25 + (seed % 10) / 20) * 100) / 100;

  const categoryFitBase =
    candidate.category.toLowerCase().includes("kitchen") ? 82
    : candidate.category.toLowerCase().includes("accessory") ? 74
    : 68;
  const categoryFitScore = clampScore(categoryFitBase + (seed % 8) - 4);

  const competitionScore = 35 + (seed % 45);
  const reviewSaturationScore = 30 + ((seed >> 4) % 50);
  const publishingReadinessScore = clampScore(
    55 +
      (candidate.images.length >= 2 ? 12 : 0) +
      (candidate.inventoryTotal > 50 ? 10 : 0) +
      (candidate.supplierReliabilityScore > 70 ? 8 : 0),
  );

  const gaps: string[] = [];
  if (candidate.images.length < 3) gaps.push("Competitors use 5–7 lifestyle images; candidate has fewer assets");
  if (candidate.estimatedDeliveryDays.max > 14) gaps.push("Prime-eligible competitors ship within 2 days");
  if (categoryFitScore < 75) gaps.push("Category keyword alignment needs refinement for Amazon browse nodes");

  const estimatedMarketplaceFeesUsd = Math.round(maxPrice * 0.15 * 100) / 100;
  const marketplaceFitScore = clampScore(categoryFitScore * 0.6 + publishingReadinessScore * 0.4);

  let marketplaceRisk: MarketplaceStudy["marketplaceRisk"] = "low";
  if (competitionScore >= 67 || reviewSaturationScore >= 67) marketplaceRisk = "high";
  else if (competitionScore >= 40) marketplaceRisk = "medium";

  const restrictionRisk: MarketplaceStudy["restrictionRisk"] =
    candidate.category.toLowerCase().includes("appliance") ? "medium" : "low";

  return {
    marketplaceId: "amazon-us",
    categoryFitScore,
    marketplaceFitScore,
    competitorPriceRangeUsd: { min: minPrice, max: maxPrice },
    reviewSaturation: densityLabel(reviewSaturationScore),
    competitionDensity: densityLabel(competitionScore),
    listingQualityGaps: gaps.length > 0 ? gaps : ["Listing parity achievable with creative refresh"],
    estimatedMarketplaceFeesUsd,
    publishingReadinessScore,
    recommendedMarketRoute: premiumPotentialRoute(candidate) ? "shopify" : "marketplace",
    marketplaceRisk,
    restrictionRisk,
  };
}

function premiumPotentialRoute(candidate: ProductCandidate): boolean {
  return candidate.supplierCostUsd >= 22 || candidate.category.toLowerCase().includes("appliance");
}
