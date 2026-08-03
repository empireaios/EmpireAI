/** X3-04 — Supplier Capacity Engine. */

import type { CapacityPlanningEngineConfiguration } from "./configuration.js";
import type { CapacityPlanningInput, CapacityPlanningRecord } from "./types.js";
import { buildCapacityRecord, computeDomainSignals } from "./structural-signals.js";

export class SupplierCapacityEngine {
  assess(
    input: CapacityPlanningInput,
    config: CapacityPlanningEngineConfiguration,
  ): CapacityPlanningRecord {
    const signals = computeDomainSignals("supplier", input, config);
    return buildCapacityRecord({ ...signals, domain: "supplier", config });
  }
}
