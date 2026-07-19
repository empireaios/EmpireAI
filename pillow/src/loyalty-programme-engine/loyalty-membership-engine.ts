/** R4-12 — Loyalty Membership Engine. */

import type { LoyaltyProgrammeEngineConfiguration } from "./configuration.js";
import type { LoyaltyTier } from "./types.js";

export class LoyaltyMembershipEngine {
  validateRegistration(input: {
    customerId: string;
    loyaltyProgrammeId: string;
    programmeExists: boolean;
    alreadyRegistered: boolean;
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!input.customerId?.trim()) errors.push("Customer ID is required");
    if (!input.loyaltyProgrammeId?.trim()) errors.push("Loyalty programme ID is required");
    if (!input.programmeExists) errors.push("Loyalty programme not found");
    if (input.alreadyRegistered) errors.push("Customer already registered for this programme");
    return { valid: errors.length === 0, errors };
  }

  initialTier(config: LoyaltyProgrammeEngineConfiguration): LoyaltyTier {
    if (!config.tierRulesEnabled) return "bronze";
    const enabled = config.tierRules.filter((r) => r.enabled).sort((a, b) => a.minPoints - b.minPoints);
    return enabled[0]?.tier ?? "bronze";
  }
}
