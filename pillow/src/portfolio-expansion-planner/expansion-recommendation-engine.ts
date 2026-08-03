/** X2-18 — Expansion Recommendation Engine. */

import type { PortfolioExpansionPlannerConfiguration } from "./configuration.js";
import type { ExpansionRecommendation, ExpansionRecord } from "./types.js";

export class ExpansionRecommendationEngine {
  recommend(input: {
    records: ExpansionRecord[];
    config: PortfolioExpansionPlannerConfiguration;
    portfolioReference?: string;
  }): ExpansionRecommendation[] {
    if (!input.config.neverInitiateExpansionAutomaticallyBeyondConfiguredApprovalPolicies) {
      return [
        {
          recommendationId: `pep-rec-${Date.now()}-blocked`,
          timestamp: new Date().toISOString(),
          portfolioReference: input.portfolioReference ?? "portfolio-enterprise",
          expansionCategory: "market",
          recommendationSummary:
            "Automatic expansion initiation blocked — approval policy enforcement required",
          estimatedInvestment: 0,
          expectedReturn: 0,
          priority: "low",
          requiresApproval: true,
          autoInitiationBlocked: true,
          structuralSignalOnly: true,
        },
      ];
    }

    const scoped = input.records.filter((r) =>
      input.portfolioReference ? r.portfolioReference === input.portfolioReference : true,
    );

    return scoped
      .filter((r) => r.expectedReturn >= input.config.minimumInvestmentThreshold)
      .map((record) => ({
        recommendationId: `pep-rec-${Date.now()}-${record.expansionPlanId}`,
        timestamp: new Date().toISOString(),
        portfolioReference: record.portfolioReference,
        expansionCategory: record.expansionCategory,
        recommendationSummary: `Recommend ${record.expansionCategory} expansion — expected return ${record.expectedReturn} vs investment ${record.estimatedInvestment} (initiation blocked pending approval)`,
        estimatedInvestment: record.estimatedInvestment,
        expectedReturn: record.expectedReturn,
        priority: record.expansionPriority,
        requiresApproval: record.requiresApproval,
        autoInitiationBlocked: true as const,
        structuralSignalOnly: true as const,
      }));
  }
}
