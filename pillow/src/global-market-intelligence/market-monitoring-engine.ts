/** X4-09 — Market Monitoring Engine. */

import type { GlobalMarketIntelligenceConfiguration } from "./configuration.js";
import {
  buildMarketIntelligenceRecord,
  computeStructuralMarketSignals,
} from "./structural-signals.js";
import type { MarketAnalysisInput, MarketIntelligenceRecord } from "./types.js";

export class MarketMonitoringEngine {
  monitorInternationalMarkets(
    input: MarketAnalysisInput,
    config: GlobalMarketIntelligenceConfiguration,
  ): MarketIntelligenceRecord {
    if (!config.marketMonitoringRulesEnabled) {
      throw new Error("Market monitoring rules disabled");
    }
    const signals = computeStructuralMarketSignals(
      { ...input, marketCategory: "international_market" },
      config,
    );
    return buildMarketIntelligenceRecord({
      ...signals,
      recommendationSummary: `Monitor international market ${signals.country}/${signals.region}`,
    });
  }

  monitorCustomerDemand(
    input: MarketAnalysisInput,
    config: GlobalMarketIntelligenceConfiguration,
  ): MarketIntelligenceRecord {
    const signals = computeStructuralMarketSignals(
      { ...input, marketCategory: "customer_demand" },
      config,
    );
    return buildMarketIntelligenceRecord({
      ...signals,
      recommendationSummary: `Monitor customer demand in ${signals.country} (score=${signals.demandScore})`,
    });
  }

  monitorProductOpportunities(
    input: MarketAnalysisInput,
    config: GlobalMarketIntelligenceConfiguration,
  ): MarketIntelligenceRecord {
    const signals = computeStructuralMarketSignals(
      { ...input, marketCategory: "product_opportunity" },
      config,
    );
    return buildMarketIntelligenceRecord({
      ...signals,
      recommendationSummary: `Monitor product opportunities in ${signals.country}/${signals.region}`,
    });
  }

  monitorRegionalGrowth(
    input: MarketAnalysisInput,
    config: GlobalMarketIntelligenceConfiguration,
  ): MarketIntelligenceRecord {
    const signals = computeStructuralMarketSignals(
      { ...input, marketCategory: "regional_growth" },
      config,
    );
    return buildMarketIntelligenceRecord({
      ...signals,
      recommendationSummary: `Monitor regional growth in ${signals.region}`,
    });
  }
}
