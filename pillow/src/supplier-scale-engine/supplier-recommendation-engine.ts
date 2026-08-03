/** X3-06 — Supplier Recommendation Engine. */

import type { SupplierScaleEngineConfiguration } from "./configuration.js";
import type { SupplierRecommendation, SupplierScalingRecord } from "./types.js";

export class SupplierRecommendationEngine {
  generate(
    records: SupplierScalingRecord[],
    config: SupplierScaleEngineConfiguration,
  ): SupplierRecommendation[] {
    // NEVER recommend without validated capacity / scores clearing thresholds.
    const eligible = records.filter(
      (r) =>
        r.capacityScore >= config.minCapacityScore &&
        r.reliabilityScore >= config.minReliabilityScore &&
        r.fulfilmentReadiness >= config.minFulfilmentReadiness &&
        r.performanceScore >= config.minPerformanceScore,
    );

    if (eligible.length === 0) {
      return [
        {
          recommendationId: `sse-rec-${Date.now()}-hold`,
          timestamp: new Date().toISOString(),
          companyReference: records[0]?.companyReference ?? "company-default",
          supplierReference: records[0]?.supplierReference ?? "supplier-default",
          recommendationSummary:
            "Hold supplier expansion — validated capacity does not clear capacity/reliability/fulfilment thresholds",
          capacityScore: records[0]?.capacityScore ?? 0,
          performanceScore: records[0]?.performanceScore ?? 0,
          reliabilityScore: records[0]?.reliabilityScore ?? 0,
          fulfilmentReadiness: records[0]?.fulfilmentReadiness ?? 0,
          structuralSignalOnly: true,
          neverRecommendSupplierExpansionWithoutValidatedCapacity: true,
        },
      ];
    }

    return eligible.slice(0, 6).map((record, index) => {
      const summary = `Scale ${record.supplierReference} cautiously — capacity ${record.capacityScore}, reliability ${record.reliabilityScore}, fulfilment ${record.fulfilmentReadiness}`;
      return {
        recommendationId: `sse-rec-${Date.now()}-${index}`,
        timestamp: new Date().toISOString(),
        companyReference: record.companyReference,
        supplierReference: record.supplierReference,
        recommendationSummary: summary,
        capacityScore: record.capacityScore,
        performanceScore: record.performanceScore,
        reliabilityScore: record.reliabilityScore,
        fulfilmentReadiness: record.fulfilmentReadiness,
        structuralSignalOnly: true,
        neverRecommendSupplierExpansionWithoutValidatedCapacity: true,
      };
    });
  }
}
