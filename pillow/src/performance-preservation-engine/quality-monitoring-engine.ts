/** X3-12 — Quality Monitoring Engine (service / fulfilment quality). */

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
  service_quality: "serviceQualityMonitoringEnabled",
  fulfilment_quality: "fulfilmentQualityMonitoringEnabled",
};

export class QualityMonitoringEngine {
  assess(
    operation: Extract<PreservationOperation, "service_quality" | "fulfilment_quality">,
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
