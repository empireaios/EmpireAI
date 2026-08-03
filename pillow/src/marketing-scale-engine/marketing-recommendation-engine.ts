/** X3-05 — Marketing Recommendation Engine. */

import type { MarketingScaleEngineConfiguration } from "./configuration.js";
import type { MarketingRecommendation, MarketingScalingRecord } from "./types.js";

export class MarketingRecommendationEngine {
  generate(
    records: MarketingScalingRecord[],
    config: MarketingScaleEngineConfiguration,
  ): MarketingRecommendation[] {
    const eligible = records.filter(
      (r) =>
        r.scalingReadinessScore >= config.minScalingReadinessScore &&
        r.returnOnAdvertisingSpend >= config.minRoasThreshold &&
        r.customerAcquisitionCost <= config.maxCacThreshold &&
        r.conversionPerformance >= config.minConversionThreshold,
    );

    if (eligible.length === 0) {
      return [
        {
          recommendationId: `mse-rec-${Date.now()}-hold`,
          timestamp: new Date().toISOString(),
          companyReference: records[0]?.companyReference ?? "company-default",
          campaignReference: records[0]?.campaignReference ?? "campaign-default",
          recommendationSummary:
            "Hold marketing expansion — validated performance does not clear CAC/ROAS/readiness thresholds",
          scalingReadinessScore: records[0]?.scalingReadinessScore ?? 0,
          customerAcquisitionCost: records[0]?.customerAcquisitionCost ?? 0,
          returnOnAdvertisingSpend: records[0]?.returnOnAdvertisingSpend ?? 0,
          structuralSignalOnly: true,
          neverRecommendMarketingExpansionWithoutValidatedPerformance: true,
        },
      ];
    }

    return eligible.slice(0, 6).map((record, index) => {
      const summary = `Scale ${record.campaignReference} cautiously — readiness ${record.scalingReadinessScore}, ROAS ${record.returnOnAdvertisingSpend}, CAC ${record.customerAcquisitionCost}`;
      return {
        recommendationId: `mse-rec-${Date.now()}-${index}`,
        timestamp: new Date().toISOString(),
        companyReference: record.companyReference,
        campaignReference: record.campaignReference,
        recommendationSummary: summary,
        scalingReadinessScore: record.scalingReadinessScore,
        customerAcquisitionCost: record.customerAcquisitionCost,
        returnOnAdvertisingSpend: record.returnOnAdvertisingSpend,
        structuralSignalOnly: true,
        neverRecommendMarketingExpansionWithoutValidatedPerformance: true,
      };
    });
  }
}
