/** X4-09 — Competitor Intelligence Engine. */

import type { GlobalMarketIntelligenceConfiguration } from "./configuration.js";
import {
  buildMarketIntelligenceRecord,
  computeStructuralMarketSignals,
} from "./structural-signals.js";
import type { MarketAnalysisInput, MarketIntelligenceRecord } from "./types.js";

export class CompetitorIntelligenceEngine {
  monitorCompetitorActivity(
    input: MarketAnalysisInput,
    config: GlobalMarketIntelligenceConfiguration,
  ): MarketIntelligenceRecord {
    const signals = computeStructuralMarketSignals(
      { ...input, marketCategory: "competitor_activity" },
      config,
    );
    return buildMarketIntelligenceRecord({
      ...signals,
      recommendationSummary: `Monitor competitor activity in ${signals.country} (competition=${signals.competitionScore})`,
    });
  }
}
