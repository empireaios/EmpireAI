import type { CompetitorAnalysis, CompetitorProfile } from "./types.js";

export function analyzeCompetitors(competitors: CompetitorProfile[]): CompetitorAnalysis[] {
  return competitors.map((competitor) => {
    const threatScore =
      competitor.marketingIntensity * 0.3 +
      competitor.brandingScore * 0.3 +
      (100 - competitor.reviewSentiment) * 0.2 +
      competitor.priceIndex * 0.2;

    const threatLevel: CompetitorAnalysis["threatLevel"] =
      threatScore >= 75 ? "high" : threatScore >= 55 ? "medium" : "low";

    const competitiveAdvantage: string[] = [];
    if (competitor.weaknesses.includes("Poor reviews")) {
      competitiveAdvantage.push("Superior customer experience and review management");
    }
    if (competitor.weaknesses.includes("No brand loyalty")) {
      competitiveAdvantage.push("Build brand identity with premium packaging");
    }
    if (competitor.priceIndex > 100) {
      competitiveAdvantage.push("Compete on value with comparable quality at lower price");
    }
    if (competitiveAdvantage.length === 0) {
      competitiveAdvantage.push("Differentiate through niche positioning and faster shipping");
    }

    return { competitor, threatLevel, competitiveAdvantage };
  });
}
