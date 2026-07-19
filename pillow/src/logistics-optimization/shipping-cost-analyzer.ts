/** R2-17 — Shipping Cost Analyzer. */

import type { LogisticsOptimizationConfiguration } from "./configuration.js";

export class ShippingCostAnalyzer {
  analyzeCost(
    baseCost: number,
    optimizedCost: number,
    config: LogisticsOptimizationConfiguration,
  ): { estimatedCost: number; savings: number; reduced: boolean } {
    const estimatedCost = Math.round(optimizedCost * 100) / 100;
    const savings = Math.max(0, Math.round((baseCost - optimizedCost) * 100) / 100);
    const reduced = savings >= config.costOptimizationThreshold * 0.1;
    return { estimatedCost, savings, reduced };
  }

  scoreCostEfficiency(cost: number, baseline: number): number {
    if (baseline <= 0) return 50;
    const ratio = cost / baseline;
    return Math.max(0, Math.min(100, Math.round((1 - ratio + 1) * 50)));
  }
}
