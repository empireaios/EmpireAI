/** X4-05 — Currency Recommendation Engine. */

import type { CurrencyIntelligenceConfiguration } from "./configuration.js";
import type { CurrencyIntelligenceRecord, CurrencyRecommendation } from "./types.js";

export class CurrencyRecommendationEngine {
  generate(
    records: CurrencyIntelligenceRecord[],
    config: CurrencyIntelligenceConfiguration,
  ): CurrencyRecommendation[] {
    return records
      .filter(
        (r) =>
          (r.validationStatus === "passed" || r.validationStatus === "partial") &&
          r.neverPerformFinancialConversionsUsingUnvalidatedExchangeData === true &&
          (r.anomalyScore >= 50 ||
            r.fluctuationPercent >= config.fluctuationAlertThresholdPercent ||
            r.exchangeRateSource === "unavailable" ||
            r.regionalPricingStatus === "partial"),
      )
      .map((r) => ({
        recommendationId: `cur-rec-${Date.now()}-${r.currencyCode}`,
        timestamp: new Date().toISOString(),
        companyReference: r.companyReference,
        currencyCode: r.currencyCode,
        exchangeRateSource: r.exchangeRateSource,
        recommendationSummary:
          r.exchangeRateSource === "unavailable"
            ? `Validate exchange data for ${r.currencyCode} before conversions`
            : `Review ${r.currencyCode} pricing/FX posture (fluctuation=${r.fluctuationPercent}%, anomaly=${r.anomalyScore})`,
        structuralSignalOnly: true as const,
        neverPerformFinancialConversionsUsingUnvalidatedExchangeData: true as const,
      }));
  }
}
