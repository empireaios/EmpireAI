import type { MarketAnalysis, MarketProfile } from "./types.js";

export function analyzeMarkets(markets: MarketProfile[]): MarketAnalysis[] {
  return markets
    .map((market) => {
      const saturationPenalty =
        market.saturation === "high" ? 15 : market.saturation === "medium" ? 5 : 0;
      const opportunityScore = Math.round(
        market.demandScore * 0.4 +
        market.growthPercent * 8 +
        (market.shippingFeasible ? 15 : 0) -
        saturationPenalty,
      );

      const recommendation =
        opportunityScore >= 80
          ? "Priority launch market — strong demand and feasible logistics"
          : opportunityScore >= 65
            ? "Secondary market — test after US/UK validation"
            : "Monitor — lower priority until primary markets prove";

      return { market, opportunityScore, launchPriority: opportunityScore, recommendation };
    })
    .sort((a, b) => b.launchPriority - a.launchPriority);
}
