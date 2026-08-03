/** X3-12 — Performance Analysis Engine (ops / response / reliability). */

import type { PerformancePreservationEngineConfiguration } from "./configuration.js";
import type {
  PreservationOperation,
  PreservationRecord,
  PerformancePreservationInput,
} from "./types.js";
import {
  buildPreservationRecord,
  computePreservationSignals,
} from "./structural-signals.js";

const OPERATION_FLAG: Partial<
  Record<PreservationOperation, keyof PerformancePreservationEngineConfiguration>
> = {
  operational_performance: "operationalPerformanceMonitoringEnabled",
  response_time: "responseTimeMonitoringEnabled",
  reliability: "reliabilityMonitoringEnabled",
};

export class PerformanceAnalysisEngine {
  assess(
    operation: Extract<
      PreservationOperation,
      "operational_performance" | "response_time" | "reliability"
    >,
    input: PerformancePreservationInput,
    config: PerformancePreservationEngineConfiguration,
    sourceAvailable = true,
  ): PreservationRecord {
    const flag = OPERATION_FLAG[operation];
    if (flag && !config[flag]) {
      throw new Error(`${operation} preservation monitoring disabled`);
    }
    const signals = computePreservationSignals(operation, input, config, sourceAvailable);
    return buildPreservationRecord({
      ...signals,
      config,
    });
  }
}
