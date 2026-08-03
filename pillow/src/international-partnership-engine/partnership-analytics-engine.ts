/** X4-12 — Partnership Analytics Engine. */

import type { InternationalPartnershipEngineConfiguration } from "./configuration.js";
import {
  buildPartnershipRecord,
  computeStructuralPartnershipSignals,
} from "./structural-signals.js";
import type { PartnershipAnalysisInput, PartnershipRecord } from "./types.js";

export class PartnershipAnalyticsEngine {
  monitorPartnershipValue(
    input: PartnershipAnalysisInput,
    config: InternationalPartnershipEngineConfiguration,
  ): PartnershipRecord {
    const signals = computeStructuralPartnershipSignals(
      { ...input, partnershipCategory: "partnership_value" },
      config,
    );
    return buildPartnershipRecord({
      ...signals,
      recommendationSummary: `Monitor partnership value with ${signals.partnerReference} in ${signals.country}`,
    });
  }

  detectPartnershipRisks(
    input: PartnershipAnalysisInput,
    config: InternationalPartnershipEngineConfiguration,
  ): PartnershipRecord {
    const signals = computeStructuralPartnershipSignals(
      {
        ...input,
        partnershipCategory: "partnership_risk",
        riskHint: input.riskHint ?? true,
        performanceHint:
          input.performanceHint ?? Math.max(10, config.performanceThreshold - 15),
      },
      config,
    );
    return buildPartnershipRecord(
      {
        ...signals,
        partnershipRiskDetected: true,
        recommendationSummary: `Partnership risk detected with ${signals.partnerReference} in ${signals.country}`,
      },
      "partial",
    );
  }

  detectPartnershipOpportunities(
    input: PartnershipAnalysisInput,
    config: InternationalPartnershipEngineConfiguration,
  ): PartnershipRecord {
    const signals = computeStructuralPartnershipSignals(
      {
        ...input,
        partnershipCategory: "partnership_opportunity",
        opportunityHint: input.opportunityHint ?? true,
        performanceHint: input.performanceHint ?? config.performanceThreshold + 15,
        reliabilityHint: input.reliabilityHint ?? config.performanceThreshold + 10,
      },
      config,
    );
    return buildPartnershipRecord(
      {
        ...signals,
        partnershipOpportunityDetected: true,
        recommendationSummary: `Partnership opportunity detected with ${signals.partnerReference} in ${signals.country}`,
      },
      "partial",
    );
  }

  riskCount(records: PartnershipRecord[]): number {
    return records.filter((r) => r.partnershipRiskDetected).length;
  }

  opportunityCount(records: PartnershipRecord[]): number {
    return records.filter((r) => r.partnershipOpportunityDetected).length;
  }
}
