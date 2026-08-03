/** X3-12 — Degradation Detection Engine. */

import type { PerformancePreservationEngineConfiguration } from "./configuration.js";
import type { PreservationRecord, PerformancePreservationInput } from "./types.js";
import {
  buildPreservationRecord,
  computePreservationSignals,
} from "./structural-signals.js";

export class DegradationDetectionEngine {
  detectPerformanceDegradation(
    input: PerformancePreservationInput,
    config: PerformancePreservationEngineConfiguration,
    sourceAvailable = true,
  ): PreservationRecord {
    if (!config.performanceDegradationDetectionEnabled) {
      throw new Error("Performance degradation detection disabled");
    }
    const signals = computePreservationSignals(
      "performance_degradation",
      input,
      config,
      sourceAvailable,
    );
    const summary = signals.detectedDegradation
      ? `Performance degradation detected at perf ${signals.performanceScore}% / CX ${signals.customerExperienceScore}% (threshold ${config.degradationThreshold}) — preserve quality before scaling`
      : `Performance ${signals.performanceScore}% within degradation bounds — ${signals.recommendationSummary}`;
    return buildPreservationRecord({
      ...signals,
      recommendationSummary: summary,
      config,
    });
  }

  detectQualityRegressions(
    input: PerformancePreservationInput,
    config: PerformancePreservationEngineConfiguration,
    sourceAvailable = true,
  ): PreservationRecord {
    if (!config.qualityRegressionDetectionEnabled) {
      throw new Error("Quality regression detection disabled");
    }
    const signals = computePreservationSignals(
      "quality_regression",
      input,
      config,
      sourceAvailable,
    );
    const summary = signals.detectedDegradation
      ? `Quality regression detected at ${signals.qualityScore}% (threshold ${config.regressionThreshold}) — hold scale until quality recovers`
      : `Quality ${signals.qualityScore}% above regression floor — ${signals.recommendationSummary}`;
    return buildPreservationRecord({
      ...signals,
      recommendationSummary: summary,
      config,
    });
  }
}
