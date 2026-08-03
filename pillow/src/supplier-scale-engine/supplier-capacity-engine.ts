/** X3-06 — Supplier Capacity Engine. */

import type { SupplierScaleEngineConfiguration } from "./configuration.js";
import type { SupplierScaleInput, SupplierScalingRecord } from "./types.js";
import { buildSupplierScalingRecord, computeSupplierSignals } from "./structural-signals.js";

export class SupplierCapacityEngine {
  assess(
    input: SupplierScaleInput,
    config: SupplierScaleEngineConfiguration,
  ): SupplierScalingRecord {
    const signals = computeSupplierSignals("capacity", input, config);
    const summary =
      signals.capacityScore < config.minCapacityScore
        ? `Capacity ${signals.capacityScore} below min ${config.minCapacityScore} — hold supplier expansion`
        : `Capacity ${signals.capacityScore} within validated threshold — monitor headroom`;
    return buildSupplierScalingRecord({
      ...signals,
      recommendationSummary: summary,
      config,
    });
  }
}
