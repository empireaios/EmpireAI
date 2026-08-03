/** X4-09 — Market Trend Engine. */

import type { GlobalMarketIntelligenceConfiguration } from "./configuration.js";
import {
  buildMarketIntelligenceRecord,
  computeStructuralMarketSignals,
} from "./structural-signals.js";
import type { MarketAnalysisInput, MarketIntelligenceRecord } from "./types.js";

export class MarketTrendEngine {
  monitorMarketTrends(
    input: MarketAnalysisInput,
    config: GlobalMarketIntelligenceConfiguration,
  ): MarketIntelligenceRecord {
    if (!config.trendAnalysisRulesEnabled) {
      throw new Error("Trend analysis rules disabled");
    }
    const signals = computeStructuralMarketSignals(
      { ...input, marketCategory: "market_trend" },
      config,
    );
    return buildMarketIntelligenceRecord({
      ...signals,
      recommendationSummary: `Analyze market trend ${signals.marketSignal} for ${signals.country}/${signals.region}`,
    });
  }
}
