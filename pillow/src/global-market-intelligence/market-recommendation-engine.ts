/** X4-09 — Market Recommendation Engine. */

import type { GlobalMarketIntelligenceConfiguration } from "./configuration.js";
import type { MarketIntelligenceRecord, MarketRecommendation } from "./types.js";

export class MarketRecommendationEngine {
  generate(
    records: MarketIntelligenceRecord[],
    _config: GlobalMarketIntelligenceConfiguration,
  ): MarketRecommendation[] {
    return records
      .filter(
        (r) =>
          (r.validationStatus === "passed" || r.validationStatus === "partial") &&
          r.neverRecommendWithUnvalidatedIntelligence === true &&
          r.unvalidatedRecommendationClaim === "none" &&
          (r.emergingDetected ||
            r.decliningDetected ||
            r.opportunityScore >= 60 ||
            r.marketSignal === "emerging" ||
            r.marketSignal === "declining"),
      )
      .map((r) => ({
        recommendationId: `gmi-rec-${Date.now()}-${r.country}-${r.marketCategory}`,
        timestamp: new Date().toISOString(),
        country: r.country,
        region: r.region,
        marketCategory: r.marketCategory,
        opportunityScore: r.opportunityScore,
        riskLevel: r.riskLevel,
        recommendationSummary: `Address ${r.marketCategory} in ${r.country}/${r.region} (opp=${r.opportunityScore}, signal=${r.marketSignal}) — validated intelligence only`,
        structuralSignalOnly: true as const,
        neverRecommendWithUnvalidatedIntelligence: true as const,
        unvalidatedRecommendationClaim: "none" as const,
      }));
  }
}
