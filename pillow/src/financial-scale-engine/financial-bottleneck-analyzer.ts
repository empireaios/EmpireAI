/** X3-07 — Financial Bottleneck Analyzer. */

import type { FinancialScaleEngineConfiguration } from "./configuration.js";
import type { FinancialScalingRecord } from "./types.js";

export class FinancialBottleneckAnalyzer {
  detect(
    records: FinancialScalingRecord[],
    config: FinancialScaleEngineConfiguration,
  ): FinancialScalingRecord[] {
    if (!config.bottleneckDetectionEnabled) return [];
    return records
      .filter(
        (r) =>
          r.capitalRequirement < config.bottleneckThreshold ||
          r.cashFlowReadiness < config.bottleneckThreshold ||
          r.profitabilityScore < config.bottleneckThreshold ||
          r.investmentEfficiencyScore < config.bottleneckThreshold ||
          r.capitalRequirement < config.minCapitalRequirement ||
          r.profitabilityScore < config.minProfitabilityScore ||
          r.investmentEfficiencyScore < config.minInvestmentEfficiencyScore,
      )
      .map((r) => {
        let recommendationSummary = r.recommendationSummary;
        if (r.capitalRequirement < config.bottleneckThreshold) {
          recommendationSummary = `Critical capital bottleneck · ${r.scalingInitiativeReference} at capital ${r.capitalRequirement}`;
        } else if (r.profitabilityScore < config.bottleneckThreshold) {
          recommendationSummary = `Critical profitability bottleneck · ${r.scalingInitiativeReference} at profitability ${r.profitabilityScore}`;
        } else if (r.cashFlowReadiness < config.bottleneckThreshold) {
          recommendationSummary = `Cash-flow bottleneck · ${r.scalingInitiativeReference} at ${r.cashFlowReadiness}`;
        } else if (r.investmentEfficiencyScore < config.bottleneckThreshold) {
          recommendationSummary = `Investment efficiency bottleneck · ${r.scalingInitiativeReference} at ${r.investmentEfficiencyScore}`;
        } else if (r.capitalRequirement < config.minCapitalRequirement) {
          recommendationSummary = `Capital below min · ${r.scalingInitiativeReference} at ${r.capitalRequirement}`;
        } else if (r.profitabilityScore < config.minProfitabilityScore) {
          recommendationSummary = `Profitability below min · ${r.scalingInitiativeReference} at ${r.profitabilityScore}`;
        } else {
          recommendationSummary = `Investment efficiency readiness bottleneck · ${r.scalingInitiativeReference} at ${r.investmentEfficiencyScore}`;
        }
        return {
          ...r,
          recommendationSummary,
          timestamp: new Date().toISOString(),
        };
      });
  }
}
