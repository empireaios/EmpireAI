/** X3-06 — Supplier Bottleneck Detector. */

import type { SupplierScaleEngineConfiguration } from "./configuration.js";
import type { SupplierScalingRecord } from "./types.js";

export class SupplierBottleneckDetector {
  detect(
    records: SupplierScalingRecord[],
    config: SupplierScaleEngineConfiguration,
  ): SupplierScalingRecord[] {
    if (!config.bottleneckDetectionEnabled) return [];
    return records
      .filter(
        (r) =>
          r.capacityScore < config.bottleneckThreshold ||
          r.performanceScore < config.bottleneckThreshold ||
          r.reliabilityScore < config.bottleneckThreshold ||
          r.fulfilmentReadiness < config.bottleneckThreshold ||
          r.capacityScore < config.minCapacityScore ||
          r.reliabilityScore < config.minReliabilityScore ||
          r.fulfilmentReadiness < config.minFulfilmentReadiness,
      )
      .map((r) => {
        let recommendationSummary = r.recommendationSummary;
        if (r.capacityScore < config.bottleneckThreshold) {
          recommendationSummary = `Critical capacity bottleneck · ${r.supplierReference} at capacity ${r.capacityScore}`;
        } else if (r.reliabilityScore < config.bottleneckThreshold) {
          recommendationSummary = `Critical reliability bottleneck · ${r.supplierReference} at reliability ${r.reliabilityScore}`;
        } else if (r.performanceScore < config.bottleneckThreshold) {
          recommendationSummary = `Performance bottleneck · ${r.supplierReference} at ${r.performanceScore}`;
        } else if (r.fulfilmentReadiness < config.bottleneckThreshold) {
          recommendationSummary = `Fulfilment bottleneck · ${r.supplierReference} at ${r.fulfilmentReadiness}`;
        } else if (r.capacityScore < config.minCapacityScore) {
          recommendationSummary = `Capacity below min · ${r.supplierReference} at ${r.capacityScore}`;
        } else if (r.reliabilityScore < config.minReliabilityScore) {
          recommendationSummary = `Reliability below min · ${r.supplierReference} at ${r.reliabilityScore}`;
        } else {
          recommendationSummary = `Fulfilment readiness bottleneck · ${r.supplierReference} at ${r.fulfilmentReadiness}`;
        }
        return {
          ...r,
          recommendationSummary,
          timestamp: new Date().toISOString(),
        };
      });
  }
}
