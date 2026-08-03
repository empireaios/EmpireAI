/** X3-07 — Financial Recommendation Engine. */

import type { FinancialScaleEngineConfiguration } from "./configuration.js";
import type { FinancialRecommendation, FinancialScalingRecord } from "./types.js";

export class FinancialRecommendationEngine {
  generate(
    records: FinancialScalingRecord[],
    config: FinancialScaleEngineConfiguration,
  ): FinancialRecommendation[] {
    // NEVER recommend without validated financial readiness / scores clearing thresholds.
    const eligible = records.filter(
      (r) =>
        r.capitalRequirement >= config.minCapitalRequirement &&
        r.profitabilityScore >= config.minProfitabilityScore &&
        r.investmentEfficiencyScore >= config.minInvestmentEfficiencyScore &&
        r.cashFlowReadiness >= config.minCashFlowReadiness,
    );

    if (eligible.length === 0) {
      return [
        {
          recommendationId: `fse-rec-${Date.now()}-hold`,
          timestamp: new Date().toISOString(),
          companyReference: records[0]?.companyReference ?? "company-default",
          scalingInitiativeReference:
            records[0]?.scalingInitiativeReference ?? "initiative-default",
          recommendationSummary:
            "Hold financial scaling — validated readiness does not clear capital/cash-flow/profitability/efficiency thresholds",
          capitalRequirement: records[0]?.capitalRequirement ?? 0,
          cashFlowReadiness: records[0]?.cashFlowReadiness ?? 0,
          profitabilityScore: records[0]?.profitabilityScore ?? 0,
          investmentEfficiencyScore: records[0]?.investmentEfficiencyScore ?? 0,
          structuralSignalOnly: true,
          neverRecommendScalingWithoutValidatedFinancialReadiness: true,
        },
      ];
    }

    return eligible.slice(0, 6).map((record, index) => {
      const summary = `Scale ${record.scalingInitiativeReference} cautiously — capital ${record.capitalRequirement}, profitability ${record.profitabilityScore}, efficiency ${record.investmentEfficiencyScore}`;
      return {
        recommendationId: `fse-rec-${Date.now()}-${index}`,
        timestamp: new Date().toISOString(),
        companyReference: record.companyReference,
        scalingInitiativeReference: record.scalingInitiativeReference,
        recommendationSummary: summary,
        capitalRequirement: record.capitalRequirement,
        cashFlowReadiness: record.cashFlowReadiness,
        profitabilityScore: record.profitabilityScore,
        investmentEfficiencyScore: record.investmentEfficiencyScore,
        structuralSignalOnly: true,
        neverRecommendScalingWithoutValidatedFinancialReadiness: true,
      };
    });
  }
}
