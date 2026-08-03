/** X3-06 — Fulfilment Capacity Engine. */

import type { SupplierScaleEngineConfiguration } from "./configuration.js";
import type { SupplierScaleInput, SupplierScalingRecord } from "./types.js";
import { buildSupplierScalingRecord, computeSupplierSignals } from "./structural-signals.js";

export class FulfilmentCapacityEngine {
  assess(
    input: SupplierScaleInput,
    config: SupplierScaleEngineConfiguration,
  ): SupplierScalingRecord {
    const signals = computeSupplierSignals("fulfilment", input, config);
    return buildSupplierScalingRecord({ ...signals, config });
  }
}
