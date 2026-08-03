/** X3-16 — Revenue Recommendation Engine. */

import type { RevenueAccelerationEngineConfiguration } from "./configuration.js";
import type {
  RevenueAccelerationRecommendation,
  RevenueAccelerationRecord,
} from "./types.js";

export class RevenueRecommendationEngine {
  generate(
    records: RevenueAccelerationRecord[],
    config: RevenueAccelerationEngineConfiguration,
  ): RevenueAccelerationRecommendation[] {
    // Never recommend revenue actions without validated supporting data.
    const eligible = records.filter(
      (r) =>
        r.validationStatus === "passed" &&
        r.revenueOpportunityScore >= config.revenueOpportunityThreshold &&
        r.revenueOpportunityScore >= config.highOpportunityThreshold,
    );

    if (eligible.length === 0) {
      return [
        {
          recommendationId: `rae-rec-${Date.now()}-hold`,
          timestamp: new Date().toISOString(),
          companyReference: records[0]?.companyReference ?? "company-default",
          revenueCategory: records[0]?.revenueCategory ?? "growth",
          recommendationSummary:
            "Hold revenue acceleration — validated structural opportunity does not clear thresholds (never recommend revenue actions without validated supporting data)",
          revenueOpportunityScore: records[0]?.revenueOpportunityScore ?? 0,
          expectedRevenueIncrease:
            records[0]?.expectedRevenueIncrease ??
            "Hold until opportunity clears validated supporting data thresholds",
          structuralSignalOnly: true,
          neverRecommendWithoutValidatedSupportingData: true,
        },
      ];
    }

    return eligible.slice(0, 8).map((record, index) => {
      const posture =
        record.revenueOpportunityScore >= config.criticalOpportunityThreshold
          ? "accelerate"
          : record.revenueOpportunityScore >= config.highOpportunityThreshold
            ? "prepare"
            : "stage";
      const summary = `${posture} ${record.revenueCategory} revenue — opportunity ${record.revenueOpportunityScore}% · never recommend without validated supporting data`;
      return {
        recommendationId: `rae-rec-${Date.now()}-${index}`,
        timestamp: new Date().toISOString(),
        companyReference: record.companyReference,
        revenueCategory: record.revenueCategory,
        recommendationSummary: summary,
        revenueOpportunityScore: record.revenueOpportunityScore,
        expectedRevenueIncrease: record.expectedRevenueIncrease,
        structuralSignalOnly: true,
        neverRecommendWithoutValidatedSupportingData: true,
      };
    });
  }
}
