/** X2-16 — Capital Optimization Engine. */

import type { PortfolioOptimizationEngineConfiguration } from "./configuration.js";
import type { OptimizationRecord } from "./types.js";
import { EnterpriseOptimizationEngine } from "./enterprise-optimization-engine.js";

export class CapitalOptimizationEngine {
  private readonly enterprise = new EnterpriseOptimizationEngine();

  optimize(input: {
    portfolioReference: string;
    expectedBenefitHint?: number;
    opportunityHint?: string;
    config: PortfolioOptimizationEngineConfiguration;
  }): OptimizationRecord {
    return this.enterprise.optimize({
      portfolioReference: input.portfolioReference,
      category: "capital",
      opportunity:
        input.opportunityHint ??
        "Reallocate capital toward higher-return portfolio segments under approval policy",
      expectedBenefitHint: input.expectedBenefitHint ?? 42,
      config: input.config,
    });
  }
}
