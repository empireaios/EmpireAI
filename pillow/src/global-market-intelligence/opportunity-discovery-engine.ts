/** X4-09 — Opportunity Discovery Engine. */

import type { GlobalMarketIntelligenceConfiguration } from "./configuration.js";
import {
  buildMarketIntelligenceRecord,
  computeStructuralMarketSignals,
} from "./structural-signals.js";
import type { MarketAnalysisInput, MarketIntelligenceRecord } from "./types.js";

export class OpportunityDiscoveryEngine {
  detectEmergingMarkets(
    input: MarketAnalysisInput,
    config: GlobalMarketIntelligenceConfiguration,
  ): MarketIntelligenceRecord {
    const signals = computeStructuralMarketSignals(
      {
        ...input,
        marketCategory: "emerging_market",
        emergingHint: input.emergingHint ?? true,
        opportunityHint: input.opportunityHint ?? 78,
        demandHint: input.demandHint ?? 72,
      },
      config,
    );
    return buildMarketIntelligenceRecord(
      {
        ...signals,
        emergingDetected: true,
        recommendationSummary: `Emerging market detected in ${signals.country}/${signals.region}`,
      },
      "partial",
    );
  }

  detectDecliningMarkets(
    input: MarketAnalysisInput,
    config: GlobalMarketIntelligenceConfiguration,
  ): MarketIntelligenceRecord {
    const signals = computeStructuralMarketSignals(
      {
        ...input,
        marketCategory: "declining_market",
        decliningHint: input.decliningHint ?? true,
        opportunityHint: input.opportunityHint ?? 22,
        demandHint: input.demandHint ?? 28,
      },
      config,
    );
    return buildMarketIntelligenceRecord(
      {
        ...signals,
        decliningDetected: true,
        recommendationSummary: `Declining market detected in ${signals.country}/${signals.region}`,
      },
      "partial",
    );
  }

  emergingCount(records: MarketIntelligenceRecord[]): number {
    return records.filter((r) => r.emergingDetected).length;
  }

  decliningCount(records: MarketIntelligenceRecord[]): number {
    return records.filter((r) => r.decliningDetected).length;
  }
}
