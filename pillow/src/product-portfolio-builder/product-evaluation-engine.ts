/** X1-08 — Product Evaluation Engine (structural scores only). */

function clamp(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function industryBias(industry: string): number {
  const token = industry.toLowerCase();
  if (token.includes("digital") || token.includes("software")) return 12;
  if (token.includes("health") || token.includes("wellness")) return 8;
  if (token.includes("consumer")) return 6;
  return 4;
}

export class ProductEvaluationEngine {
  estimateProfitability(industry: string, productCount: number): number {
    return clamp(58 + industryBias(industry) + Math.min(15, productCount * 2));
  }

  estimateDemand(industry: string, productCount: number): number {
    return clamp(55 + industryBias(industry) + Math.min(12, productCount * 1.5));
  }

  evaluateOpportunitySummary(industry: string, profitability: number, demand: number): string {
    return [
      `industry=${industry}`,
      `profitability=${profitability}`,
      `demand=${demand}`,
      "signal=structural-opportunity",
    ].join(" · ");
  }
}
