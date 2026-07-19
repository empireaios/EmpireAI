/** R4-12 — Loyalty Rewards Engine. */

import type { LoyaltyProgrammeEngineConfiguration } from "./configuration.js";

export class LoyaltyRewardsEngine {
  validateRewardGeneration(input: {
    pointsCost: number;
    currentBalance: number;
    config: LoyaltyProgrammeEngineConfiguration;
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!input.pointsCost || input.pointsCost <= 0) {
      errors.push("Reward points cost must be positive");
    }
    if (input.pointsCost > input.currentBalance) {
      errors.push("Insufficient balance to generate reward");
    }

    if (input.config.rewardRulesEnabled) {
      const rule = input.config.rewardRules.find((r) => r.enabled);
      if (rule) {
        if (input.pointsCost < rule.minPointsCost || input.pointsCost > rule.maxPointsCost) {
          errors.push("Reward points cost outside allowed range");
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }
}
