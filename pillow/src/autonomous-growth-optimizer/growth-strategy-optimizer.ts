/** X3-15 — Growth Strategy Optimizer (optimize + rank). */

import type { AutonomousGrowthOptimizerConfiguration } from "./configuration.js";
import type {
  GrowthOptimizationRecord,
  GrowthOptimizationInput,
} from "./types.js";
import {
  buildGrowthOptimizationRecord,
  computeGrowthOptimizationSignals,
} from "./structural-signals.js";

const PRIORITY_RANK: Record<GrowthOptimizationRecord["optimizationPriority"], number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export class GrowthStrategyOptimizer {
  optimize(
    input: GrowthOptimizationInput,
    config: AutonomousGrowthOptimizerConfiguration,
    sourceAvailable = true,
  ): GrowthOptimizationRecord {
    if (!config.growthStrategyOptimizationEnabled) {
      throw new Error("Growth strategy optimization disabled");
    }
    const signals = computeGrowthOptimizationSignals(
      "growth_strategy_optimization",
      input,
      config,
      sourceAvailable,
    );
    const summary =
      signals.growthOpportunityScore >= config.growthOpportunityThreshold
        ? `Optimized sustainable growth strategy for ${signals.growthCategory} at opportunity ${signals.growthOpportunityScore}% — never optimize beyond validated operational limits`
        : signals.recommendationSummary;
    return buildGrowthOptimizationRecord({
      ...signals,
      recommendationSummary: summary,
    });
  }

  rank(
    records: GrowthOptimizationRecord[],
    config: AutonomousGrowthOptimizerConfiguration,
  ): GrowthOptimizationRecord[] {
    if (!config.growthPriorityRankingEnabled) {
      throw new Error("Growth priority ranking disabled");
    }
    // Rank by priority then opportunity — never optimize beyond validated operational limits.
    return [...records].sort((a, b) => {
      const priorityDelta =
        PRIORITY_RANK[b.optimizationPriority] - PRIORITY_RANK[a.optimizationPriority];
      if (priorityDelta !== 0) return priorityDelta;
      return b.growthOpportunityScore - a.growthOpportunityScore;
    });
  }
}
