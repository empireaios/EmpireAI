/** X3-16 — Revenue Strategy Optimizer (optimize + rank). */

import type { RevenueAccelerationEngineConfiguration } from "./configuration.js";
import type {
  RevenueAccelerationRecord,
  RevenueAccelerationInput,
} from "./types.js";
import {
  buildRevenueAccelerationRecord,
  computeRevenueAccelerationSignals,
} from "./structural-signals.js";

export class RevenueStrategyOptimizer {
  optimize(
    input: RevenueAccelerationInput,
    config: RevenueAccelerationEngineConfiguration,
    sourceAvailable = true,
  ): RevenueAccelerationRecord {
    if (!config.revenueStrategyOptimizationEnabled) {
      throw new Error("Revenue strategy optimization disabled");
    }
    const signals = computeRevenueAccelerationSignals(
      "revenue_strategy_optimization",
      input,
      config,
      sourceAvailable,
    );
    const summary =
      signals.revenueOpportunityScore >= config.revenueOpportunityThreshold
        ? `Optimized revenue strategy for ${signals.revenueCategory} at opportunity ${signals.revenueOpportunityScore}% — never recommend revenue actions without validated supporting data`
        : signals.recommendationSummary;
    return buildRevenueAccelerationRecord({
      ...signals,
      recommendationSummary: summary,
    });
  }

  rank(
    records: RevenueAccelerationRecord[],
    config: RevenueAccelerationEngineConfiguration,
  ): RevenueAccelerationRecord[] {
    if (!config.revenueOpportunityRankingEnabled) {
      throw new Error("Revenue opportunity ranking disabled");
    }
    // Rank by opportunity score — never recommend without validated supporting data.
    return [...records].sort((a, b) => b.revenueOpportunityScore - a.revenueOpportunityScore);
  }
}
