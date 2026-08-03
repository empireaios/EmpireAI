/** X2-16 — Enterprise Optimization Engine (performance + efficiency). */

import type { PortfolioOptimizationEngineConfiguration } from "./configuration.js";
import type { OptimizationCategory, OptimizationPriority, OptimizationRecord } from "./types.js";
import { POE_METADATA_VERSION } from "./paths.js";

function priorityFromBenefit(
  benefit: number,
  config: PortfolioOptimizationEngineConfiguration,
): OptimizationPriority {
  if (benefit >= config.highPriorityBenefitThreshold + 20) return "critical";
  if (benefit >= config.highPriorityBenefitThreshold) return "high";
  if (benefit >= config.minimumExpectedBenefitThreshold + 10) return "medium";
  return "low";
}

export class EnterpriseOptimizationEngine {
  optimize(input: {
    portfolioReference: string;
    category: OptimizationCategory;
    opportunity: string;
    expectedBenefitHint?: number;
    config: PortfolioOptimizationEngineConfiguration;
  }): OptimizationRecord {
    const base =
      input.expectedBenefitHint ??
      (input.category === "performance"
        ? 35
        : input.category === "operational_efficiency"
          ? 28
          : 22);
    const expectedBenefit = Math.max(
      0,
      Math.min(100, Math.round(base + (input.config.optimizationRulesEnabled ? 8 : 0))),
    );
    const optimizationPriority = priorityFromBenefit(expectedBenefit, input.config);
    const requiresApproval =
      input.config.requireApprovalForHighImpactOptimizations &&
      (optimizationPriority === "high" || optimizationPriority === "critical");

    return {
      portfolioOptimizationId: `poe-opt-${Date.now()}`,
      timestamp: new Date().toISOString(),
      portfolioReference: input.portfolioReference,
      optimizationCategory: input.category,
      optimizationOpportunity: input.opportunity,
      expectedBenefit,
      optimizationPriority,
      recommendationSummary: `Recommend structural ${input.category} optimization — expected benefit ${expectedBenefit}`,
      validationStatus: "passed",
      metadataVersion: POE_METADATA_VERSION,
      rankedPosition: null,
      requiresApproval,
      autoExecutionBlocked: true,
      structuralSignalOnly: true,
      sensitiveEnterpriseData: false,
    };
  }
}
