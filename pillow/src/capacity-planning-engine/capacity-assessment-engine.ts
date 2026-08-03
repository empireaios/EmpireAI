/** X3-04 — Capacity Assessment Engine (operational domain). */

import type { CapacityPlanningEngineConfiguration } from "./configuration.js";
import type { CapacityPlanningInput, CapacityPlanningRecord } from "./types.js";
import { buildCapacityRecord, computeDomainSignals } from "./structural-signals.js";

export class CapacityAssessmentEngine {
  assess(
    input: CapacityPlanningInput,
    config: CapacityPlanningEngineConfiguration,
  ): CapacityPlanningRecord {
    const signals = computeDomainSignals("operational", input, config);
    return buildCapacityRecord({ ...signals, domain: "operational", config });
  }
}
