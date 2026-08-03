/** X4-14 — Regional Performance Engine. */

import type { RegionalGrowthOptimizerConfiguration } from "./configuration.js";
import {
  buildOptimizationRecord,
  computeStructuralRegionalSignals,
} from "./structural-signals.js";
import type { RegionalOptimizationInput, RegionalOptimizationRecord } from "./types.js";

export class RegionalPerformanceEngine {
  monitorRegionalBusinessPerformance(
    input: RegionalOptimizationInput,
    config: RegionalGrowthOptimizerConfiguration,
  ): RegionalOptimizationRecord {
    if (!config.regionalOptimizationRulesEnabled) {
      throw new Error("Regional optimization rules disabled");
    }
    const signals = computeStructuralRegionalSignals(
      { ...input, optimizationCategory: "regional_business_performance" },
      config,
    );
    return buildOptimizationRecord({
      ...signals,
      recommendationSummary: `Monitor regional business performance in ${signals.region}`,
    });
  }

  monitorRegionalOperationalEfficiency(
    input: RegionalOptimizationInput,
    config: RegionalGrowthOptimizerConfiguration,
  ): RegionalOptimizationRecord {
    const signals = computeStructuralRegionalSignals(
      { ...input, optimizationCategory: "regional_operational_efficiency" },
      config,
    );
    return buildOptimizationRecord(
      {
        ...signals,
        recommendationSummary: `Monitor regional operational efficiency in ${signals.region}`,
      },
      signals.revenueScore < config.performanceThreshold ? "partial" : "passed",
    );
  }
}
