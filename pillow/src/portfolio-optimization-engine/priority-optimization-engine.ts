/** X2-16 — Priority Optimization Engine. */

import type { PortfolioOptimizationEngineConfiguration } from "./configuration.js";
import type { OptimizationPriority, OptimizationRecord } from "./types.js";
import { EnterpriseOptimizationEngine } from "./enterprise-optimization-engine.js";

export class PriorityOptimizationEngine {
  private readonly enterprise = new EnterpriseOptimizationEngine();

  optimize(input: {
    portfolioReference: string;
    expectedBenefitHint?: number;
    opportunityHint?: string;
    config: PortfolioOptimizationEngineConfiguration;
  }): OptimizationRecord {
    return this.enterprise.optimize({
      portfolioReference: input.portfolioReference,
      category: "priority",
      opportunity:
        input.opportunityHint ??
        "Align company priorities to highest Long-Term Empire Value contributions",
      expectedBenefitHint: input.expectedBenefitHint ?? 38,
      config: input.config,
    });
  }

  rank(records: OptimizationRecord[]): OptimizationRecord[] {
    const weight: Record<OptimizationPriority, number> = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
    };
    return [...records]
      .sort((a, b) => {
        const pw = weight[b.optimizationPriority] - weight[a.optimizationPriority];
        if (pw !== 0) return pw;
        return b.expectedBenefit - a.expectedBenefit;
      })
      .map((record, index) => ({
        ...record,
        rankedPosition: index + 1,
        timestamp: new Date().toISOString(),
      }));
  }
}
