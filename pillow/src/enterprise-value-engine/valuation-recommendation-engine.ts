/** X2-19 — Valuation Recommendation Engine. */

import type { EnterpriseValueEngineConfiguration } from "./configuration.js";
import type { ValuationRecommendation, ValuationRecord } from "./types.js";

export class ValuationRecommendationEngine {
  recommend(input: {
    records: ValuationRecord[];
    config: EnterpriseValueEngineConfiguration;
    portfolioReference?: string;
    companyReference?: string | null;
  }): ValuationRecommendation[] {
    if (!input.config.neverRepresentEstimatedValuesAsGuaranteedMarketPrices) {
      return [
        {
          recommendationId: `eve-rec-${Date.now()}-blocked`,
          timestamp: new Date().toISOString(),
          portfolioReference: input.portfolioReference ?? "portfolio-enterprise",
          companyReference: input.companyReference ?? null,
          recommendationSummary:
            "Valuation recommendations blocked — estimated values must not be represented as guaranteed market prices",
          estimatedValue: 0,
          confidenceScore: 0,
          valuationMethodology: input.config.valuationMethodology,
          notGuaranteedMarketPrice: true,
          structuralSignalOnly: true,
        },
      ];
    }

    const scoped = input.records.filter((r) => {
      if (input.portfolioReference && r.portfolioReference !== input.portfolioReference) {
        return false;
      }
      if (input.companyReference !== undefined && r.companyReference !== input.companyReference) {
        return false;
      }
      return true;
    });

    return scoped
      .filter((r) => r.confidenceScore >= input.config.minimumConfidenceThreshold)
      .map((record) => {
        const estimatedValue = record.companyReference
          ? record.companyValuation
          : record.portfolioValuation || record.enterpriseValuation;

        return {
          recommendationId: `eve-rec-${Date.now()}-${record.enterpriseValueId}`,
          timestamp: new Date().toISOString(),
          portfolioReference: record.portfolioReference,
          companyReference: record.companyReference,
          recommendationSummary: `Structural valuation recommendation — estimated value ${estimatedValue} (confidence ${record.confidenceScore}%) — not a guaranteed market price`,
          estimatedValue,
          confidenceScore: record.confidenceScore,
          valuationMethodology: record.valuationMethodology,
          notGuaranteedMarketPrice: true as const,
          structuralSignalOnly: true as const,
        };
      });
  }
}
