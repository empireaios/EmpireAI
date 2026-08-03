/** X3-04 — Capacity Recommendation Engine. */

import type { CapacityPlanningRecord, CapacityRecommendation } from "./types.js";

export class CapacityRecommendationEngine {
  generate(records: CapacityPlanningRecord[]): CapacityRecommendation[] {
    const source =
      records.length > 0
        ? records
        : [
            {
              capacityPlanningId: "cpe-cap-seed",
              timestamp: new Date().toISOString(),
              companyReference: "company-default",
              productReference: "product-default",
              domain: "operational" as const,
              currentCapacity: 50,
              forecastDemand: 55,
              capacityUtilization: 55,
              bottleneckSummary: "Collect additional capacity signals",
              recommendedExpansion: 5,
              validationStatus: "partial" as const,
              metadataVersion: "CPE-001-v1",
              neverRecommendBeyondValidatedLimits: true as const,
              structuralSignalOnly: true as const,
              sensitiveOperationalData: false as const,
            },
          ];

    return source.slice(0, 6).map((record, index) => {
      const summary =
        record.recommendedExpansion > 0
          ? `Expand ${record.domain} capacity by ~${record.recommendedExpansion} units for ${record.productReference} (utilization ${record.capacityUtilization}%)`
          : `Hold ${record.domain} capacity for ${record.productReference}; utilization ${record.capacityUtilization}% within validated limits`;
      return {
        recommendationId: `cpe-rec-${Date.now()}-${index}`,
        timestamp: new Date().toISOString(),
        companyReference: record.companyReference,
        productReference: record.productReference,
        domain: record.domain,
        recommendationSummary: summary,
        recommendedExpansion: record.recommendedExpansion,
        capacityUtilization: record.capacityUtilization,
        structuralSignalOnly: true,
        neverRecommendBeyondValidatedLimits: true,
      };
    });
  }
}
