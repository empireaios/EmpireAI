/** X1-10 — Product Readiness Engine (structural signals only). */

import type { DomainScore } from "./business-validation-engine.js";

export class ProductReadinessEngine {
  validateProductPortfolioReadiness(input: {
    hasPortfolio: boolean;
    productCount?: number;
    profitability?: number;
  }): DomainScore {
    if (!input.hasPortfolio) {
      return { present: false, score: 12, note: "portfolio-missing" };
    }
    let score = 78;
    if ((input.productCount ?? 0) >= 3) score += 8;
    if ((input.profitability ?? 0) >= 60) score += 6;
    return {
      present: true,
      score: Math.max(0, Math.min(100, score)),
      note: "portfolio-ready",
    };
  }
}
