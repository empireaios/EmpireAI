/** X3-12 — Customer Experience Engine. */

import type { PerformancePreservationEngineConfiguration } from "./configuration.js";
import type { PreservationRecord, PerformancePreservationInput } from "./types.js";
import {
  buildPreservationRecord,
  computePreservationSignals,
} from "./structural-signals.js";

export class CustomerExperienceEngine {
  monitor(
    input: PerformancePreservationInput,
    config: PerformancePreservationEngineConfiguration,
    sourceAvailable = true,
  ): PreservationRecord {
    if (!config.customerExperienceMonitoringEnabled) {
      throw new Error("Customer experience monitoring disabled");
    }
    const signals = computePreservationSignals(
      "customer_experience",
      input,
      config,
      sourceAvailable,
    );
    // Never compromise CX for scaling — surface explicit preservation posture.
    const summary =
      signals.customerExperienceScore < config.customerExperienceThreshold
        ? `CX ${signals.customerExperienceScore}% below ${config.customerExperienceThreshold} — block scale-driven CX trade-offs`
        : signals.recommendationSummary;
    return buildPreservationRecord({
      ...signals,
      recommendationSummary: summary,
      config,
    });
  }
}
