/** X1-10 — Pricing Validation Engine (structural signals only). */

import type { DomainScore } from "./business-validation-engine.js";

export class PricingValidationEngine {
  validatePricingReadiness(input: {
    hasPricing: boolean;
    margin?: number;
    unprofitableFlags?: string;
    automaticPublication?: boolean;
  }): DomainScore {
    if (!input.hasPricing) {
      return { present: false, score: 14, note: "pricing-missing" };
    }
    let score = 82;
    if ((input.margin ?? 0) >= 20) score += 8;
    if (input.unprofitableFlags && input.unprofitableFlags !== "none") score -= 20;
    if (input.automaticPublication === true) score -= 40;
    return {
      present: true,
      score: Math.max(0, Math.min(100, score)),
      note: "pricing-ready",
    };
  }
}
