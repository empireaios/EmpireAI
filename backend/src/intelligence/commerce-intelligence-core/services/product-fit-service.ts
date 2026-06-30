import type { ArbitrageAnalysis, ProductCandidate, ProductFitIntelligence } from "../models/commerce-intelligence-core.js";

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

/** Product fit intelligence — routes common products to marketplace, premium to Shopify. */
export function evaluateProductFit(
  candidate: ProductCandidate,
  arbitrage: ArbitrageAnalysis,
): ProductFitIntelligence {
  const title = candidate.title.toLowerCase();
  const category = candidate.category.toLowerCase();

  const premiumSignals =
    (title.includes("premium") ? 15 : 0) +
    (category.includes("appliance") ? 12 : 0) +
    (candidate.supplierCostUsd > 20 ? 10 : 0) +
    (candidate.images.length >= 2 ? 8 : 0);

  const premiumPotential = clampScore(45 + premiumSignals);
  const impulsePotential = clampScore(
    category.includes("accessory") ? 72 : category.includes("kitchen") ? 58 : 50,
  );
  const giftingPotential = clampScore(
    category.includes("kitchen") ? 65 : category.includes("accessory") ? 55 : 45,
  );
  const adFriendliness = clampScore(
    50 + (candidate.images.length >= 2 ? 15 : 0) + (impulsePotential > 60 ? 12 : 0),
  );
  const visualAppeal = clampScore(55 + candidate.images.length * 8);
  const repeatPurchasePotential = clampScore(
    category.includes("accessory") ? 40 : category.includes("appliance") ? 25 : 35,
  );

  const route: ProductFitIntelligence["route"] =
    premiumPotential >= 70 || candidate.supplierCostUsd >= 22 ? "shopify" : "marketplace";

  const routeRationale =
    route === "shopify"
      ? "Premium or brandable product profile — Shopify route preserves margin and brand narrative"
      : "Common product profile — Amazon marketplace route maximizes discovery velocity";

  const refundRisk: ProductFitIntelligence["refundRisk"] =
    category.includes("appliance") ? "medium" : arbitrage.downsideRisk === "high" ? "medium" : "low";

  const productFitScore = clampScore(
    impulsePotential * 0.2 + adFriendliness * 0.2 + visualAppeal * 0.2 + premiumPotential * 0.2 + giftingPotential * 0.2,
  );

  const seasonality =
    category.includes("kitchen")
      ? "Peak Q4 gifting and New Year refresh cycles"
      : "Steady year-round demand with mild Q4 uplift";

  const buyerPersona =
    category.includes("kitchen")
      ? "Home cooks upgrading everyday kitchen tools"
      : "Practical shoppers seeking reliable accessories";
  const painPoint =
    category.includes("kitchen")
      ? "Inconsistent blend quality and fragile pitchers break the workflow"
      : "Replacement parts are overpriced or hard to source quickly";

  const buyerRationale = `${buyerPersona} experiences ${painPoint.toLowerCase()} — ${route} route maximizes ${route === "shopify" ? "brand margin" : "marketplace velocity"}`;

  return {
    buyerPersona,
    painPoint,
    impulsePotential,
    giftingPotential,
    premiumPotential,
    adFriendliness,
    refundRisk,
    visualAppeal,
    repeatPurchasePotential,
    seasonality,
    productFitScore,
    route,
    routeRationale,
    buyerRationale,
  };
}
