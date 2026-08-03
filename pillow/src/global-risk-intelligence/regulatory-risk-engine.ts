/** X4-14 — Regional Profitability Engine. */

import type { GlobalRiskIntelligenceConfiguration } from "./configuration.js";
import {
  buildOptimizationRecord,
  computeStructuralRegionalSignals,
} from "./structural-signals.js";
import type { RegionalOptimizationInput, RegionalOptimizationRecord } from "./types.js";

export class RegionalProfitabilityEngine {
  monitorRegionalProfitability(
    input: RegionalOptimizationInput,
    config: GlobalRiskIntelligenceConfiguration,
  ): RegionalOptimizationRecord {
    const signals = computeStructuralRegionalSignals(
      { ...input, optimizationCategory: "regional_profitability" },
      config,
    );
    return buildOptimizationRecord(
      {
        ...signals,
        recommendationSummary: `Monitor regional profitability in ${signals.region} (score=${signals.profitabilityScore})`,
      },
      signals.profitabilityScore < config.performanceThreshold ? "partial" : "passed",
    );
  }
}
