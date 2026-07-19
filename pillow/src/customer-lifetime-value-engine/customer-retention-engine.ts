/** R4-15 — Customer Retention Engine. */

import type { CustomerLifetimeValueEngineConfiguration } from "./configuration.js";

export class CustomerRetentionEngine {
  analyze(input: {
    timelineEventCount: number;
    purchaseFrequency: number;
    loyaltyTier: string | null;
    loyaltyPoints: number;
    riskScore: number;
    config: CustomerLifetimeValueEngineConfiguration;
  }): { retentionScore: number } {
    if (!input.config.retentionRulesEnabled) {
      return { retentionScore: 50 };
    }

    let score = 40;

    if (input.purchaseFrequency >= 2) score += 15;
    if (input.purchaseFrequency >= 5) score += 10;

    for (const rule of input.config.retentionRules) {
      if (!rule.enabled) continue;
      if (
        rule.ruleId === "activity_retention" &&
        input.timelineEventCount >= rule.minActivityEvents
      ) {
        score += rule.scoreBoost;
      }
    }

    if (input.loyaltyTier === "gold" || input.loyaltyTier === "platinum") score += 15;
    else if (input.loyaltyTier === "silver") score += 8;
    if (input.loyaltyPoints >= 500) score += 5;

    score -= Math.min(30, Math.floor(input.riskScore / 4));

    return { retentionScore: Math.max(0, Math.min(100, score)) };
  }
}
