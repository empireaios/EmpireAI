/** X4-13 — Workforce Analytics Engine. */

import type { GlobalTalentIntelligenceConfiguration } from "./configuration.js";
import {
  buildWorkforceRecord,
  computeStructuralWorkforceSignals,
} from "./structural-signals.js";
import type { WorkforceAnalysisInput, WorkforceIntelligenceRecord } from "./types.js";

export class WorkforceAnalyticsEngine {
  monitorWorkforceCosts(
    input: WorkforceAnalysisInput,
    config: GlobalTalentIntelligenceConfiguration,
  ): WorkforceIntelligenceRecord {
    const signals = computeStructuralWorkforceSignals(
      { ...input, workforceCategory: "workforce_cost" },
      config,
    );
    const costScore = Math.round(input.costHint ?? signals.utilizationScore);
    return buildWorkforceRecord({
      ...signals,
      recommendationSummary: `Monitor workforce costs in ${signals.region} (index=${costScore})`,
    });
  }

  monitorWorkforceUtilization(
    input: WorkforceAnalysisInput,
    config: GlobalTalentIntelligenceConfiguration,
  ): WorkforceIntelligenceRecord {
    const signals = computeStructuralWorkforceSignals(
      { ...input, workforceCategory: "workforce_utilization" },
      config,
    );
    return buildWorkforceRecord(
      {
        ...signals,
        recommendationSummary: `Monitor workforce utilization in ${signals.region} (score=${signals.utilizationScore})`,
      },
      signals.utilizationScore < config.capabilityThreshold ? "partial" : "passed",
    );
  }

  detectWorkforceShortages(
    input: WorkforceAnalysisInput,
    config: GlobalTalentIntelligenceConfiguration,
  ): WorkforceIntelligenceRecord {
    const signals = computeStructuralWorkforceSignals(
      {
        ...input,
        workforceCategory: "workforce_shortage",
        shortageHint: input.shortageHint ?? true,
        availabilityHint:
          input.availabilityHint ?? Math.max(10, config.capabilityThreshold - 15),
      },
      config,
    );
    return buildWorkforceRecord(
      {
        ...signals,
        workforceShortageDetected: true,
        recommendationSummary: `Workforce shortage detected in ${signals.region}`,
      },
      "partial",
    );
  }

  detectWorkforceOpportunities(
    input: WorkforceAnalysisInput,
    config: GlobalTalentIntelligenceConfiguration,
  ): WorkforceIntelligenceRecord {
    const signals = computeStructuralWorkforceSignals(
      {
        ...input,
        workforceCategory: "workforce_opportunity",
        opportunityHint: input.opportunityHint ?? true,
        capabilityHint: input.capabilityHint ?? config.capabilityThreshold + 15,
        availabilityHint: input.availabilityHint ?? config.capabilityThreshold + 10,
      },
      config,
    );
    return buildWorkforceRecord(
      {
        ...signals,
        workforceOpportunityDetected: true,
        recommendationSummary: `Workforce opportunity detected in ${signals.region}`,
      },
      "partial",
    );
  }

  shortageCount(records: WorkforceIntelligenceRecord[]): number {
    return records.filter((r) => r.workforceShortageDetected).length;
  }

  opportunityCount(records: WorkforceIntelligenceRecord[]): number {
    return records.filter((r) => r.workforceOpportunityDetected).length;
  }
}
