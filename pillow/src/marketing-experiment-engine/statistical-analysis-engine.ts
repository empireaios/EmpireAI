/** R5-17 — Statistical Analysis Engine. */

import type { MarketingExperimentEngineConfiguration } from "./configuration.js";
import type { ExperimentRecord } from "./types.js";

export class StatisticalAnalysisEngine {
  compareVariants(record: ExperimentRecord): ExperimentRecord {
    const variants = record.variantReferences;
    const winner =
      variants.length > 1
        ? variants[record.performanceMetrics.conversionRate >= 8 ? 1 : 0]!
        : variants[0] ?? null;
    return {
      ...record,
      winningVariant: winner,
      experimentStatus: "analyzing",
      timestamp: new Date().toISOString(),
    };
  }

  detectSignificance(
    record: ExperimentRecord,
    config: MarketingExperimentEngineConfiguration,
  ): ExperimentRecord {
    const significant =
      record.performanceMetrics.sampleSize >= config.minimumSampleSize &&
      record.performanceMetrics.confidence >= config.significanceThreshold;
    const compared = this.compareVariants(record);
    return {
      ...compared,
      statisticallySignificant: significant,
      experimentStatus: significant ? "completed" : "analyzing",
      timestamp: new Date().toISOString(),
    };
  }
}
