/** X3-04 — Infrastructure Capacity Engine. */

import type { CapacityPlanningEngineConfiguration } from "./configuration.js";
import type { CapacityPlanningInput, CapacityPlanningRecord } from "./types.js";
import { buildCapacityRecord, computeDomainSignals } from "./structural-signals.js";

export class InfrastructureCapacityEngine {
  assess(
    input: CapacityPlanningInput,
    config: CapacityPlanningEngineConfiguration,
  ): CapacityPlanningRecord {
    const signals = computeDomainSignals("infrastructure", input, config);
    return buildCapacityRecord({ ...signals, domain: "infrastructure", config });
  }
}
