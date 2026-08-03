/** X2-16 — Optimization Recommendation Engine. */

import type { PortfolioOptimizationEngineConfiguration } from "./configuration.js";
import type { OptimizationRecommendation, OptimizationRecord } from "./types.js";

export class OptimizationRecommendationEngine {
  recommend(input: {
    records: OptimizationRecord[];
    config: PortfolioOptimizationEngineConfiguration;
    portfolioReference?: string;
  }): OptimizationRecommendation[] {
    if (!input.config.recommendationRulesEnabled) {
      return [
        {
          recommendationId: `poe-rec-${Date.now()}-disabled`,
          timestamp: new Date().toISOString(),
          portfolioReference: input.portfolioReference ?? "portfolio-enterprise",
          optimizationCategory: "performance",
          recommendationSummary: "Recommendation rules disabled — manual review only",
          expectedBenefit: 0,
          priority: "low",
          requiresApproval: true,
          autoExecutionBlocked: true,
          structuralSignalOnly: true,
        },
      ];
    }

    const scoped = input.records.filter((r) =>
      input.portfolioReference ? r.portfolioReference === input.portfolioReference : true,
    );

    return scoped
      .filter((r) => r.expectedBenefit >= input.config.minimumExpectedBenefitThreshold)
      .map((record) => ({
        recommendationId: `poe-rec-${Date.now()}-${record.portfolioOptimizationId}`,
        timestamp: new Date().toISOString(),
        portfolioReference: record.portfolioReference,
        optimizationCategory: record.optimizationCategory,
        recommendationSummary: record.recommendationSummary,
        expectedBenefit: record.expectedBenefit,
        priority: record.optimizationPriority,
        requiresApproval: record.requiresApproval,
        autoExecutionBlocked: true as const,
        structuralSignalOnly: true as const,
      }));
  }
}
