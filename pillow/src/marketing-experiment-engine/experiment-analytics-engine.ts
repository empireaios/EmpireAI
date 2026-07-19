/** R5-17 — Experiment Analytics Engine. */

import type { ExperimentPerformanceMetrics, ExperimentRecord } from "./types.js";

export class ExperimentAnalyticsEngine {
  measure(input: {
    impressions: number;
    conversions: number;
    sampleSize: number;
    confidence: number;
  }): ExperimentPerformanceMetrics {
    const conversionRate =
      input.impressions <= 0
        ? 0
        : Math.round((input.conversions / input.impressions) * 10000) / 100;
    return {
      impressions: input.impressions,
      conversions: input.conversions,
      conversionRate,
      sampleSize: input.sampleSize,
      confidence: Math.round(input.confidence * 1000) / 1000,
    };
  }

  applyMetrics(record: ExperimentRecord, metrics: ExperimentPerformanceMetrics): ExperimentRecord {
    return {
      ...record,
      performanceMetrics: { ...metrics },
      experimentStatus: "analyzing",
      timestamp: new Date().toISOString(),
    };
  }

  runningCount(records: ExperimentRecord[]): number {
    return records.filter((r) => r.experimentStatus === "running" || r.experimentStatus === "analyzing")
      .length;
  }
}
