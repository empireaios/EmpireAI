/** R4-12 — Loyalty Points Engine. */

import type { LoyaltyProgrammeEngineConfiguration } from "./configuration.js";

export class LoyaltyPointsEngine {
  validateAward(
    points: number,
    config: LoyaltyProgrammeEngineConfiguration,
  ): { valid: boolean; errors: string[]; normalizedPoints: number } {
    const errors: string[] = [];
    let normalized = Math.round(points);

    if (!Number.isFinite(normalized) || normalized <= 0) {
      errors.push("Points must be a positive number");
    }
    if (normalized > config.maxPointsPerAward) {
      errors.push(`Points exceed maximum award limit (${config.maxPointsPerAward})`);
    }

    if (config.pointsCalculationRulesEnabled) {
      for (const rule of config.pointsCalculationRules) {
        if (!rule.enabled) continue;
        if (normalized > rule.maxPointsPerTransaction) {
          normalized = rule.maxPointsPerTransaction;
        }
      }
    }

    return { valid: errors.length === 0, errors, normalizedPoints: normalized };
  }

  validateRedemption(
    points: number,
    currentBalance: number,
    config: LoyaltyProgrammeEngineConfiguration,
  ): { valid: boolean; errors: string[]; normalizedPoints: number } {
    const errors: string[] = [];
    const normalized = Math.round(points);

    if (!Number.isFinite(normalized) || normalized <= 0) {
      errors.push("Redemption points must be a positive number");
    }
    if (normalized > currentBalance) {
      errors.push("Insufficient points balance for redemption");
    }

    if (config.rewardRulesEnabled) {
      const rule = config.rewardRules.find((r) => r.enabled);
      if (rule) {
        if (normalized < rule.minPointsCost) {
          errors.push(`Minimum redemption is ${rule.minPointsCost} points`);
        }
        if (normalized > rule.maxPointsCost) {
          errors.push(`Maximum redemption is ${rule.maxPointsCost} points`);
        }
      }
    }

    return { valid: errors.length === 0, errors, normalizedPoints: normalized };
  }
}
