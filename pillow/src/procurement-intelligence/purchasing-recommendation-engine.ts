/** R2-19 — Purchasing Recommendation Engine. */

import type { ProcurementIntelligenceConfiguration } from "./configuration.js";
import type { PurchaseTimingRecommendation } from "./types.js";

export class PurchasingRecommendationEngine {
  recommendQuantity(
    historicalAverage: number,
    availableInventory: number,
    config: ProcurementIntelligenceConfiguration,
  ): number {
    if (!config.purchasingRecommendationRulesEnabled) return Math.max(1, historicalAverage);
    const base = historicalAverage > 0 ? historicalAverage : 10;
    if (availableInventory < base) return Math.round(base * 1.5);
    return Math.max(1, Math.round(base));
  }

  recommendTiming(
    priceTrend: "rising" | "falling" | "stable",
    riskScore: number,
    config: ProcurementIntelligenceConfiguration,
  ): PurchaseTimingRecommendation {
    if (!config.purchasingRecommendationRulesEnabled) return "standard";
    if (priceTrend === "rising" && riskScore < 50) return "immediate";
    if (priceTrend === "falling") return "opportunistic";
    if (riskScore >= 70) return "delayed";
    return "standard";
  }
}
