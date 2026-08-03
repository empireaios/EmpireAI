/** X4-14 — Regional Recommendation Engine. */

import type { GlobalRiskIntelligenceConfiguration } from "./configuration.js";
import type { RegionalGrowthRecommendation, RegionalOptimizationRecord } from "./types.js";

export class RegionalRecommendationEngine {
  generate(
    records: RegionalOptimizationRecord[],
    config: GlobalRiskIntelligenceConfiguration,
  ): RegionalGrowthRecommendation[] {
    return records
      .filter(
        (r) =>
          (r.validationStatus === "passed" || r.validationStatus === "partial") &&
          r.neverOptimizeUsingUnvalidatedRegionalIntelligence === true &&
          r.unvalidatedOptimizationClaim === "none" &&
          (r.growthOpportunityDetected ||
            r.bottleneckDetected ||
            r.optimizationStatus === "under_review" ||
            r.optimizationStatus === "partial" ||
            r.revenueScore < config.performanceThreshold ||
            r.profitabilityScore < config.performanceThreshold),
      )
      .map((r) => ({
        recommendationId: `gri-rec-${Date.now()}-${r.region}-${r.optimizationCategory}`,
        timestamp: new Date().toISOString(),
        companyReference: r.companyReference,
        region: r.region,
        optimizationCategory: r.optimizationCategory,
        optimizationPriority: r.optimizationPriority,
        recommendationSummary: `Address ${r.optimizationCategory} in ${r.region} (revenue=${r.revenueScore}, profit=${r.profitabilityScore}) — no unvalidated optimization`,
        structuralSignalOnly: true as const,
        neverOptimizeUsingUnvalidatedRegionalIntelligence: true as const,
        unvalidatedOptimizationClaim: "none" as const,
      }));
  }
}
