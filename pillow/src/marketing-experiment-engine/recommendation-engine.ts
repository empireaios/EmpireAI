/** R5-17 — Experiment Recommendation Engine. */

import type { ExperimentRecord } from "./types.js";

export class RecommendationEngine {
  recommend(record: ExperimentRecord): string {
    if (record.statisticallySignificant && record.winningVariant) {
      return `Recommend ${record.winningVariant} as winner for ${record.experimentName} — not deployed without validation.`;
    }
    if (record.performanceMetrics.sampleSize < 100) {
      return `Continue collecting samples for ${record.experimentName} — current sample ${record.performanceMetrics.sampleSize}.`;
    }
    if (record.winningVariant) {
      return `Leading variant ${record.winningVariant} not yet statistically significant.`;
    }
    return `Maintain experiment pacing for ${record.experimentName}.`;
  }

  recommendForSet(records: ExperimentRecord[]): ExperimentRecord[] {
    return records.map((record) => ({
      ...record,
      recommendationSummary: this.recommend(record),
      deployedToProduction: false as const,
      timestamp: new Date().toISOString(),
    }));
  }
}
