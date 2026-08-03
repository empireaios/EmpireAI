/** X4-14 — Regional Revenue Engine. */

import type { RegionalGrowthOptimizerConfiguration } from "./configuration.js";
import {
  buildOptimizationRecord,
  computeStructuralRegionalSignals,
} from "./structural-signals.js";
import type { RegionalOptimizationInput, RegionalOptimizationRecord } from "./types.js";

export class RegionalRevenueEngine {
  monitorRegionalRevenueGrowth(
    input: RegionalOptimizationInput,
    config: RegionalGrowthOptimizerConfiguration,
  ): RegionalOptimizationRecord {
    const signals = computeStructuralRegionalSignals(
      { ...input, optimizationCategory: "regional_revenue_growth" },
      config,
    );
    return buildOptimizationRecord(
      {
        ...signals,
        recommendationSummary: `Monitor regional revenue growth in ${signals.region} (score=${signals.revenueScore})`,
      },
      signals.revenueScore < config.performanceThreshold ? "partial" : "passed",
    );
  }

  monitorRegionalCustomerGrowth(
    input: RegionalOptimizationInput,
    config: RegionalGrowthOptimizerConfiguration,
  ): RegionalOptimizationRecord {
    const signals = computeStructuralRegionalSignals(
      { ...input, optimizationCategory: "regional_customer_growth" },
      config,
    );
    return buildOptimizationRecord(
      {
        ...signals,
        recommendationSummary: `Monitor regional customer growth in ${signals.region} (score=${signals.customerGrowthScore})`,
      },
      signals.customerGrowthScore < config.performanceThreshold ? "partial" : "passed",
    );
  }
}
