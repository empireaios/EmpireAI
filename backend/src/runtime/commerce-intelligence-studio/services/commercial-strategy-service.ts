import { randomUUID } from "node:crypto";

import type { SupplierProductInput } from "../models/commercial-review.js";
import type { CommercialStrategyRecommendation, CommercialStrategyType } from "../models/commercial-strategy.js";
import { STRATEGY_LABELS } from "../models/commercial-strategy.js";
import { getCommercialReview } from "./commercial-review-service.js";
import { getCisRepository } from "../repositories/sqlite-cis-repository.js";

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function scoreStrategy(strategy: CommercialStrategyType, product: SupplierProductInput, reviewScore: number): number {
  const retail = product.suggestedRetailPrice ?? product.costPrice * 2.5;
  const margin = product.marginPercent ?? ((retail - product.costPrice) / retail) * 100;

  switch (strategy) {
    case "high_volume":
      return margin >= 30 && reviewScore >= 65 ? 80 : 55;
    case "premium":
      return margin >= 45 ? 85 : margin >= 35 ? 70 : 50;
    case "penetration":
      return margin >= 20 && margin <= 40 ? 75 : 45;
    case "cash_flow":
      return product.shippingDays != null && product.shippingDays <= 10 ? 78 : 60;
    case "brand_building":
      return reviewScore >= 60 ? 72 : 48;
    case "long_tail":
      return product.category.includes("niche") || product.tags.length >= 3 ? 70 : 55;
    case "experimental":
      return reviewScore >= 50 ? 65 : 40;
    default:
      return 50;
  }
}

/** CIS-003 — Commercial Strategy Engine. */
export function recommendCommercialStrategy(
  workspaceId: string,
  companyId: string,
  product: SupplierProductInput,
): CommercialStrategyRecommendation {
  const review = getCommercialReview(workspaceId, companyId, product.supplierProductId);
  const reviewScore = review?.aggregateScore ?? 60;

  const retail = product.suggestedRetailPrice ?? product.costPrice * 2.5;
  const margin = product.marginPercent ?? ((retail - product.costPrice) / retail) * 100;

  const strategies: CommercialStrategyType[] = [
    "high_volume", "premium", "penetration", "cash_flow", "brand_building", "long_tail", "experimental",
  ];

  const scored = strategies
    .map((s) => ({ strategy: s, fitScore: scoreStrategy(s, product, reviewScore) }))
    .sort((a, b) => b.fitScore - a.fitScore);

  const recommended = scored[0]!;
  const alt = scored.slice(1, 4);

  let pricingApproach = "Competitive retail positioning";
  let suggestedPrice = retail;
  let expectedOutcome = "Steady revenue with moderate growth";
  let reasoning = "Balanced commercial profile supports sustainable launch";

  switch (recommended.strategy) {
    case "premium":
      pricingApproach = "Premium pricing with value justification";
      suggestedPrice = retail * 1.15;
      expectedOutcome = "Higher margin per unit, lower volume, stronger brand perception";
      reasoning = `Margin ${margin.toFixed(0)}% and review score ${reviewScore} support premium positioning`;
      break;
    case "high_volume":
      pricingApproach = "Competitive pricing for volume capture";
      suggestedPrice = retail * 0.95;
      expectedOutcome = "Higher unit velocity, marketplace ranking potential";
      reasoning = "Strong margin buffer allows competitive pricing without sacrificing profitability";
      break;
    case "penetration":
      pricingApproach = "Introductory pricing to gain market share";
      suggestedPrice = retail * 0.88;
      expectedOutcome = "Fast customer acquisition, review accumulation";
      reasoning = "Penetration strategy accelerates proof of demand";
      break;
    case "cash_flow":
      pricingApproach = "Fast-turn pricing optimized for cash conversion";
      suggestedPrice = retail;
      expectedOutcome = "Rapid revenue cycle with short payback period";
      reasoning = "Shipping and margin profile favor cash flow optimization";
      break;
    case "brand_building":
      pricingApproach = "Brand-consistent pricing with story-driven value";
      suggestedPrice = retail * 1.05;
      expectedOutcome = "Brand equity growth over immediate margin maximization";
      reasoning = "Product narrative and review quality support brand-first launch";
      break;
    case "long_tail":
      pricingApproach = "Niche pricing for specialized demand";
      suggestedPrice = retail * 1.1;
      expectedOutcome = "Sustained low-competition revenue stream";
      reasoning = "Category and tag profile indicate long-tail opportunity";
      break;
    case "experimental":
      pricingApproach = "Test pricing with limited inventory exposure";
      suggestedPrice = retail;
      expectedOutcome = "Market signal collection with controlled risk";
      reasoning = "Insufficient data for confident strategy — experiment recommended";
      break;
  }

  const newMargin = ((suggestedPrice - product.costPrice) / suggestedPrice) * 100;

  const result: CommercialStrategyRecommendation = {
    strategyId: randomUUID(),
    workspaceId,
    companyId,
    supplierProductId: product.supplierProductId,
    recommendedStrategy: recommended.strategy,
    displayName: STRATEGY_LABELS[recommended.strategy],
    pricingStrategy: {
      approach: pricingApproach,
      suggestedRetailPrice: Math.round(suggestedPrice * 100) / 100,
      marginPercent: Math.round(newMargin * 10) / 10,
      rationale: reasoning,
    },
    expectedOutcome,
    reasoning,
    confidence: clamp(recommended.fitScore),
    alternativeStrategies: alt.map((a) => ({
      strategy: a.strategy,
      displayName: STRATEGY_LABELS[a.strategy],
      fitScore: a.fitScore,
    })),
    computedAt: new Date().toISOString(),
  };

  getCisRepository().saveStrategy(result);
  return result;
}

export function getCommercialStrategy(
  workspaceId: string,
  companyId: string,
  supplierProductId: string,
): CommercialStrategyRecommendation | null {
  return getCisRepository().getLatestStrategy(workspaceId, companyId, supplierProductId);
}
