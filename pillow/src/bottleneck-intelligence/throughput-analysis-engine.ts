/** X3-10 — Throughput Analysis Engine. */

import type { BottleneckIntelligenceConfiguration } from "./configuration.js";
import type { BottleneckIntelligenceInput, BottleneckRecord } from "./types.js";
import {
  buildBottleneckRecord,
  computeBottleneckSignals,
} from "./structural-signals.js";

export class ThroughputAnalysisEngine {
  detectConstraints(
    input: BottleneckIntelligenceInput,
    config: BottleneckIntelligenceConfiguration,
    sourceAvailable = true,
  ): BottleneckRecord {
    if (!config.throughputConstraintDetectionEnabled) {
      throw new Error("Throughput constraint detection disabled");
    }
    const signals = computeBottleneckSignals("throughput", input, config, sourceAvailable);
    const throughputScore = Math.round(
      input.throughputHint ??
        Math.max(0, 100 - signals.severityScore),
    );
    const summary =
      throughputScore < config.throughputConstraintThreshold
        ? `Throughput constraint detected at ${throughputScore} (threshold ${config.throughputConstraintThreshold}) — hold scaling flow`
        : `Throughput structural score ${throughputScore} within validated bounds — ${signals.recommendationSummary}`;
    return buildBottleneckRecord({
      ...signals,
      recommendationSummary: summary,
      config,
    });
  }
}
