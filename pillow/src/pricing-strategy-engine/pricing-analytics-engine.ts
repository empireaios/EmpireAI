/** X1-09 — Pricing Analytics Engine (structural signals only). */

export class PricingAnalyticsEngine {
  analyze(input: {
    pricingModel: string;
    sellingPrice: number;
    margin: number;
    competitiveScore: number;
    willingnessToPayScore: number;
  }): string {
    return [
      `model=${input.pricingModel}`,
      `price=${input.sellingPrice}`,
      `margin=${input.margin}`,
      `competitive=${input.competitiveScore}`,
      `wtp=${input.willingnessToPayScore}`,
      "analytics=structural",
    ].join(" · ");
  }

  detectConflicts(input: {
    sellingPrice: number;
    margin: number;
    competitiveScore: number;
    willingnessToPayScore: number;
  }): string {
    const conflicts: string[] = [];
    if (input.sellingPrice > 0 && input.margin < 10) {
      conflicts.push("margin-price-mismatch");
    }
    if (input.competitiveScore < 40 && input.willingnessToPayScore < 40) {
      conflicts.push("weak-market-position");
    }
    if (input.willingnessToPayScore + 15 < input.competitiveScore) {
      conflicts.push("wtp-below-competitive-band");
    }
    return conflicts.length === 0 ? "none" : conflicts.join(" | ");
  }

  evaluateWillingnessToPay(industry: string, sellingPrice: number): number {
    const token = industry.toLowerCase();
    let score = 60;
    if (token.includes("premium") || token.includes("health")) score += 10;
    if (token.includes("consumer")) score += 4;
    if (sellingPrice > 150) score -= 8;
    if (sellingPrice < 20) score += 5;
    return Math.max(0, Math.min(100, Math.round(score)));
  }
}
