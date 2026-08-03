/** X4-14 — Regional Optimization Engine. */

import type { GlobalRiskIntelligenceConfiguration } from "./configuration.js";
import {
  buildOptimizationRecord,
  computeStructuralRegionalSignals,
} from "./structural-signals.js";
import type { RegionalOptimizationInput, RegionalOptimizationRecord } from "./types.js";

export class RegionalOptimizationEngine {
  rankRegionalOptimizationPriorities(
    input: RegionalOptimizationInput,
    config: GlobalRiskIntelligenceConfiguration,
  ): RegionalOptimizationRecord {
    if (!config.priorityCalculationRulesEnabled) {
      throw new Error("Priority calculation rules disabled");
    }
    const signals = computeStructuralRegionalSignals(
      { ...input, optimizationCategory: "regional_optimization_priority" },
      config,
    );
    return buildOptimizationRecord({
      ...signals,
      recommendationSummary: `Rank optimization priority for ${signals.region} as ${signals.optimizationPriority}`,
    });
  }
}
