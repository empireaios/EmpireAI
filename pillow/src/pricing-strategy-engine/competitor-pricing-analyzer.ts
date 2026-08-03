/** X1-09 — Competitor Pricing Analyzer (structural signals only). */

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export class CompetitorPricingAnalyzer {
  evaluateCompetitiveScore(industry: string, sellingPrice: number): number {
    const token = industry.toLowerCase();
    const industryBias = token.includes("digital") ? 8 : token.includes("consumer") ? 4 : 6;
    const pricePressure = sellingPrice > 100 ? -6 : sellingPrice < 25 ? 4 : 0;
    return clampScore(62 + industryBias + pricePressure);
  }

  summarize(industry: string, competitiveScore: number): string {
    return `competitor-band:${industry} · score=${competitiveScore} · signal=structural`;
  }
}
