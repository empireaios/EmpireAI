/** R4-13 — Return Analysis Engine. */

import type { ReturnReason } from "./types.js";
import type { ReturnsIntelligenceEngineConfiguration } from "./configuration.js";

const REASON_RISK: Record<ReturnReason, number> = {
  defective: 15,
  wrong_item: 20,
  not_as_described: 25,
  changed_mind: 40,
  damaged_in_transit: 10,
  other: 30,
};

export class ReturnAnalysisEngine {
  calculateRiskScore(input: {
    returnReason: ReturnReason;
    priorReturnCount: number;
    hasOpenTicket: boolean;
    config: ReturnsIntelligenceEngineConfiguration;
  }): number {
    if (!input.config.riskScoringRulesEnabled) return 0;

    const rule = input.config.riskScoringRules.find((r) => r.enabled) ?? {
      baseScore: 20,
      repeatReturnMultiplier: 15,
    };

    let score = REASON_RISK[input.returnReason] ?? rule.baseScore;
    score += input.priorReturnCount * rule.repeatReturnMultiplier;
    if (input.hasOpenTicket) score += 10;

    return Math.max(0, Math.min(100, score));
  }

  isEligible(input: {
    priorReturnCountThisMonth: number;
    config: ReturnsIntelligenceEngineConfiguration;
  }): { eligible: boolean; errors: string[] } {
    if (!input.config.eligibilityRulesEnabled) {
      return { eligible: true, errors: [] };
    }

    const errors: string[] = [];
    if (input.priorReturnCountThisMonth >= input.config.maxReturnsPerCustomerPerMonth) {
      errors.push(
        `Customer exceeded ${input.config.maxReturnsPerCustomerPerMonth} returns this month`,
      );
    }

    return { eligible: errors.length === 0, errors };
  }
}
