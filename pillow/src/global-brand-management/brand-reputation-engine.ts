/** X4-11 — Brand Reputation Engine. */

import type { GlobalBrandManagementConfiguration } from "./configuration.js";
import {
  buildBrandGovernanceRecord,
  computeStructuralBrandSignals,
} from "./structural-signals.js";
import type { BrandAnalysisInput, BrandGovernanceRecord } from "./types.js";

export class BrandReputationEngine {
  monitorBrandPerformance(
    input: BrandAnalysisInput,
    config: GlobalBrandManagementConfiguration,
  ): BrandGovernanceRecord {
    const signals = computeStructuralBrandSignals(
      { ...input, brandCategory: "brand_performance" },
      config,
    );
    return buildBrandGovernanceRecord({
      ...signals,
      recommendationSummary: `Monitor brand performance for ${signals.brandReference} (consistency=${signals.brandConsistencyScore})`,
    });
  }

  monitorBrandReputation(
    input: BrandAnalysisInput,
    config: GlobalBrandManagementConfiguration,
  ): BrandGovernanceRecord {
    const signals = computeStructuralBrandSignals(
      { ...input, brandCategory: "brand_reputation" },
      config,
    );
    return buildBrandGovernanceRecord(
      {
        ...signals,
        recommendationSummary: `Monitor brand reputation for ${signals.brandReference} (score=${signals.reputationScore})`,
      },
      signals.reputationScore < config.reputationThreshold ? "partial" : "passed",
    );
  }

  detectReputationRisks(
    input: BrandAnalysisInput,
    config: GlobalBrandManagementConfiguration,
  ): BrandGovernanceRecord {
    const signals = computeStructuralBrandSignals(
      {
        ...input,
        brandCategory: "reputation_risk",
        reputationRiskHint: input.reputationRiskHint ?? true,
        reputationHint: input.reputationHint ?? Math.max(10, config.reputationThreshold - 15),
      },
      config,
    );
    return buildBrandGovernanceRecord(
      {
        ...signals,
        reputationRiskDetected: true,
        recommendationSummary: `Reputation risk detected for ${signals.brandReference} in ${signals.region}`,
      },
      "partial",
    );
  }

  reputationRiskCount(records: BrandGovernanceRecord[]): number {
    return records.filter((r) => r.reputationRiskDetected).length;
  }
}
