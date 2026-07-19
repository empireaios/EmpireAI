/** R4-12 — Loyalty Tier Manager. */

import type { LoyaltyProgrammeEngineConfiguration } from "./configuration.js";
import type { LoyaltyTier } from "./types.js";

export class LoyaltyTierManager {
  resolveTier(
    pointsBalance: number,
    config: LoyaltyProgrammeEngineConfiguration,
  ): LoyaltyTier {
    if (!config.tierRulesEnabled) return "bronze";

    const sorted = config.tierRules
      .filter((r) => r.enabled)
      .sort((a, b) => b.minPoints - a.minPoints);

    for (const rule of sorted) {
      if (pointsBalance >= rule.minPoints) return rule.tier;
    }
    return "bronze";
  }
}
