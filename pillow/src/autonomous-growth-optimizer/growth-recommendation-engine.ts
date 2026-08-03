/** X3-15 — Growth Recommendation Engine. */

import type { AutonomousGrowthOptimizerConfiguration } from "./configuration.js";
import type {
  AutonomousGrowthRecommendation,
  GrowthOptimizationRecord,
} from "./types.js";

export class GrowthRecommendationEngine {
  generate(
    records: GrowthOptimizationRecord[],
    config: AutonomousGrowthOptimizerConfiguration,
  ): AutonomousGrowthRecommendation[] {
    // Never optimize growth beyond validated operational limits.
    const eligible = records.filter(
      (r) =>
        r.validationStatus === "passed" &&
        r.growthOpportunityScore >= config.growthOpportunityThreshold &&
        (r.optimizationPriority === "critical" ||
          r.optimizationPriority === "high" ||
          r.growthOpportunityScore >= config.highPriorityThreshold),
    );

    if (eligible.length === 0) {
      return [
        {
          recommendationId: `ago-rec-${Date.now()}-hold`,
          timestamp: new Date().toISOString(),
          companyReference: records[0]?.companyReference ?? "company-default",
          growthCategory: records[0]?.growthCategory ?? "enterprise",
          recommendationSummary:
            "Hold growth acceleration — validated structural opportunity does not clear thresholds (never optimize beyond validated operational limits)",
          optimizationPriority: records[0]?.optimizationPriority ?? "low",
          growthOpportunityScore: records[0]?.growthOpportunityScore ?? 0,
          expectedGrowthImpact:
            records[0]?.expectedGrowthImpact ??
            "Hold until opportunity clears validated operational limits",
          structuralSignalOnly: true,
          neverOptimizeBeyondValidatedOperationalLimits: true,
        },
      ];
    }

    return eligible.slice(0, 8).map((record, index) => {
      const posture =
        record.optimizationPriority === "critical"
          ? "accelerate"
          : record.optimizationPriority === "high"
            ? "prepare"
            : "stage";
      const summary = `${posture} sustainable ${record.growthCategory} growth — opportunity ${record.growthOpportunityScore}% · never optimize beyond validated operational limits`;
      return {
        recommendationId: `ago-rec-${Date.now()}-${index}`,
        timestamp: new Date().toISOString(),
        companyReference: record.companyReference,
        growthCategory: record.growthCategory,
        recommendationSummary: summary,
        optimizationPriority: record.optimizationPriority,
        growthOpportunityScore: record.growthOpportunityScore,
        expectedGrowthImpact: record.expectedGrowthImpact,
        structuralSignalOnly: true,
        neverOptimizeBeyondValidatedOperationalLimits: true,
      };
    });
  }
}
