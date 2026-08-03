/** X2-16 — Resource Optimization Engine. */

import type { PortfolioOptimizationEngineConfiguration } from "./configuration.js";
import type { OptimizationRecord } from "./types.js";
import { EnterpriseOptimizationEngine } from "./enterprise-optimization-engine.js";

export class ResourceOptimizationEngine {
  private readonly enterprise = new EnterpriseOptimizationEngine();

  optimize(input: {
    portfolioReference: string;
    expectedBenefitHint?: number;
    opportunityHint?: string;
    config: PortfolioOptimizationEngineConfiguration;
  }): OptimizationRecord {
    return this.enterprise.optimize({
      portfolioReference: input.portfolioReference,
      category: "resource",
      opportunity:
        input.opportunityHint ??
        "Improve cross-company resource utilization and reduce idle capacity",
      expectedBenefitHint: input.expectedBenefitHint ?? 33,
      config: input.config,
    });
  }
}
