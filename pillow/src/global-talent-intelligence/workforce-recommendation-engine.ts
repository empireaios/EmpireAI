/** X4-13 — Workforce Recommendation Engine. */

import type { GlobalTalentIntelligenceConfiguration } from "./configuration.js";
import type { WorkforceRecommendation, WorkforceIntelligenceRecord } from "./types.js";

export class WorkforceRecommendationEngine {
  generate(
    records: WorkforceIntelligenceRecord[],
    config: GlobalTalentIntelligenceConfiguration,
  ): WorkforceRecommendation[] {
    return records
      .filter(
        (r) =>
          (r.validationStatus === "passed" || r.validationStatus === "partial") &&
          r.neverMakeWorkforceDecisionsUsingUnvalidatedIntelligence === true &&
          r.unvalidatedDecisionClaim === "none" &&
          (r.workforceShortageDetected ||
            r.workforceOpportunityDetected ||
            r.decisionStatus === "under_review" ||
            r.decisionStatus === "partial" ||
            r.capabilityScore < config.capabilityThreshold ||
            r.availabilityScore < config.capabilityThreshold),
      )
      .map((r) => ({
        recommendationId: `tal-rec-${Date.now()}-${r.region}-${r.workforceCategory}`,
        timestamp: new Date().toISOString(),
        companyReference: r.companyReference,
        region: r.region,
        workforceCategory: r.workforceCategory,
        riskLevel: r.riskLevel,
        recommendationSummary: `Address ${r.workforceCategory} in ${r.region} (capability=${r.capabilityScore}, availability=${r.availabilityScore}) — no unvalidated decisions`,
        structuralSignalOnly: true as const,
        neverMakeWorkforceDecisionsUsingUnvalidatedIntelligence: true as const,
        unvalidatedDecisionClaim: "none" as const,
      }));
  }
}
