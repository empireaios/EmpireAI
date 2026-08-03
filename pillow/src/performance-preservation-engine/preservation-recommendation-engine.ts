/** X3-12 — Preservation Recommendation Engine. */

import type { PerformancePreservationEngineConfiguration } from "./configuration.js";
import type { PreservationRecommendation, PreservationRecord } from "./types.js";

export class PreservationRecommendationEngine {
  generate(
    records: PreservationRecord[],
    config: PerformancePreservationEngineConfiguration,
  ): PreservationRecommendation[] {
    // Never compromise CX for scaling — only recommend when structural evidence clears thresholds.
    const eligible = records.filter(
      (r) =>
        r.detectedDegradation ||
        r.qualityScore <= config.lowQualityThreshold ||
        r.customerExperienceScore < config.customerExperienceThreshold ||
        r.performanceScore <= config.degradationThreshold,
    );

    if (eligible.length === 0) {
      return [
        {
          recommendationId: `ppe-rec-${Date.now()}-hold`,
          timestamp: new Date().toISOString(),
          companyReference: records[0]?.companyReference ?? "company-default",
          operationalComponent: records[0]?.operationalComponent ?? "component-default",
          recommendationSummary:
            "Hold preservation actions — validated structural evidence does not clear quality/CX thresholds (never compromise customer experience for scaling)",
          performanceScore: records[0]?.performanceScore ?? 0,
          qualityScore: records[0]?.qualityScore ?? 0,
          customerExperienceScore:
            records[0]?.customerExperienceScore ?? config.customerExperienceThreshold,
          structuralSignalOnly: true,
          neverCompromiseCustomerExperienceForScaling: true,
        },
      ];
    }

    return eligible.slice(0, 8).map((record, index) => {
      const posture = record.detectedDegradation
        ? "preserve"
        : record.customerExperienceScore < config.customerExperienceThreshold
          ? "protect_cx"
          : "monitor";
      const summary = `${posture} on ${record.operationalComponent} — quality ${record.qualityScore}%, perf ${record.performanceScore}%, CX ${record.customerExperienceScore}% · never compromise CX for scaling`;
      return {
        recommendationId: `ppe-rec-${Date.now()}-${index}`,
        timestamp: new Date().toISOString(),
        companyReference: record.companyReference,
        operationalComponent: record.operationalComponent,
        recommendationSummary: summary,
        performanceScore: record.performanceScore,
        qualityScore: record.qualityScore,
        customerExperienceScore: record.customerExperienceScore,
        structuralSignalOnly: true,
        neverCompromiseCustomerExperienceForScaling: true,
      };
    });
  }
}
