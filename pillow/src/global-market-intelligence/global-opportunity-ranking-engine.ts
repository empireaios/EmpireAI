/** X4-09 — Global Opportunity Ranking Engine. */

import type { GlobalMarketIntelligenceConfiguration } from "./configuration.js";
import {
  buildMarketIntelligenceRecord,
  computeStructuralMarketSignals,
} from "./structural-signals.js";
import type { MarketAnalysisInput, MarketIntelligenceRecord } from "./types.js";

export class GlobalOpportunityRankingEngine {
  rankGlobalOpportunities(
    input: MarketAnalysisInput,
    config: GlobalMarketIntelligenceConfiguration,
    existing: MarketIntelligenceRecord[],
  ): MarketIntelligenceRecord {
    if (!config.opportunityRankingRulesEnabled) {
      throw new Error("Opportunity ranking rules disabled");
    }
    const signals = computeStructuralMarketSignals(
      { ...input, marketCategory: "opportunity_ranking" },
      config,
    );
    const peerScores = [
      ...existing.map((r) => r.opportunityScore),
      signals.opportunityScore,
    ].sort((a, b) => b - a);
    const rankingPosition = peerScores.indexOf(signals.opportunityScore) + 1;

    return buildMarketIntelligenceRecord(
      {
        ...signals,
        recommendationSummary: `Ranked opportunity #${rankingPosition} for ${signals.country}/${signals.region} (score=${signals.opportunityScore})`,
      },
      "passed",
      rankingPosition,
    );
  }
}
