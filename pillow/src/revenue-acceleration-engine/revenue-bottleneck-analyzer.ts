/** X3-16 — Revenue Bottleneck Analyzer. */

import type { RevenueAccelerationEngineConfiguration } from "./configuration.js";
import type { RevenueAccelerationRecord, RevenueAccelerationInput } from "./types.js";
import {
  buildRevenueAccelerationRecord,
  computeRevenueAccelerationSignals,
} from "./structural-signals.js";

export class RevenueBottleneckAnalyzer {
  identify(
    input: RevenueAccelerationInput,
    config: RevenueAccelerationEngineConfiguration,
    sourceAvailable = true,
  ): RevenueAccelerationRecord {
    if (!config.revenueBottleneckIdentificationEnabled) {
      throw new Error("Revenue bottleneck identification disabled");
    }
    const signals = computeRevenueAccelerationSignals(
      "revenue_bottleneck_identification",
      input,
      config,
      sourceAvailable,
    );
    const bottlenecked = signals.revenueOpportunityScore < config.revenueGrowthThreshold;
    const summary = bottlenecked
      ? `Revenue bottleneck detected for ${signals.revenueCategory} — opportunity ${signals.revenueOpportunityScore}% below growth threshold; never recommend revenue actions without validated supporting data`
      : `No hard revenue bottleneck for ${signals.revenueCategory} at opportunity ${signals.revenueOpportunityScore}% — remain within validated supporting data`;
    return buildRevenueAccelerationRecord({
      ...signals,
      revenueCategory: "growth",
      expectedRevenueIncrease: bottlenecked
        ? "Bottlenecked — hold acceleration until supporting data clears"
        : signals.expectedRevenueIncrease,
      recommendationSummary: summary,
    });
  }
}
