/** X4-14 — Regional Opportunity Engine. */

import type { GlobalRiskIntelligenceConfiguration } from "./configuration.js";
import {
  buildOptimizationRecord,
  computeStructuralRegionalSignals,
} from "./structural-signals.js";
import type { RegionalOptimizationInput, RegionalOptimizationRecord } from "./types.js";

export class RegionalOpportunityEngine {
  detectRegionalGrowthOpportunities(
    input: RegionalOptimizationInput,
    config: GlobalRiskIntelligenceConfiguration,
  ): RegionalOptimizationRecord {
    const signals = computeStructuralRegionalSignals(
      {
        ...input,
        optimizationCategory: "regional_growth_opportunity",
        opportunityHint: input.opportunityHint ?? true,
        revenueHint: input.revenueHint ?? config.performanceThreshold + 15,
        customerGrowthHint: input.customerGrowthHint ?? config.performanceThreshold + 10,
      },
      config,
    );
    return buildOptimizationRecord(
      {
        ...signals,
        growthOpportunityDetected: true,
        recommendationSummary: `Regional growth opportunity detected in ${signals.region}`,
      },
      "partial",
    );
  }

  detectRegionalPerformanceBottlenecks(
    input: RegionalOptimizationInput,
    config: GlobalRiskIntelligenceConfiguration,
  ): RegionalOptimizationRecord {
    const signals = computeStructuralRegionalSignals(
      {
        ...input,
        optimizationCategory: "regional_performance_bottleneck",
        bottleneckHint: input.bottleneckHint ?? true,
        revenueHint: input.revenueHint ?? Math.max(10, config.performanceThreshold - 15),
      },
      config,
    );
    return buildOptimizationRecord(
      {
        ...signals,
        bottleneckDetected: true,
        recommendationSummary: `Regional performance bottleneck detected in ${signals.region}`,
      },
      "partial",
    );
  }

  opportunityCount(records: RegionalOptimizationRecord[]): number {
    return records.filter((r) => r.growthOpportunityDetected).length;
  }

  bottleneckCount(records: RegionalOptimizationRecord[]): number {
    return records.filter((r) => r.bottleneckDetected).length;
  }
}
