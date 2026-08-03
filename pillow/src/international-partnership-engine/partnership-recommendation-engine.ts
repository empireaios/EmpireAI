/** X4-12 — Partnership Recommendation Engine. */

import type { InternationalPartnershipEngineConfiguration } from "./configuration.js";
import type { PartnershipRecommendation, PartnershipRecord } from "./types.js";

export class PartnershipRecommendationEngine {
  generate(
    records: PartnershipRecord[],
    config: InternationalPartnershipEngineConfiguration,
  ): PartnershipRecommendation[] {
    return records
      .filter(
        (r) =>
          (r.validationStatus === "passed" || r.validationStatus === "partial") &&
          r.neverApproveStrategicPartnershipsWithoutValidation === true &&
          r.unvalidatedApprovalClaim === "none" &&
          (r.partnershipRiskDetected ||
            r.partnershipOpportunityDetected ||
            r.approvalStatus === "under_review" ||
            r.approvalStatus === "partial" ||
            r.performanceScore < config.performanceThreshold ||
            r.reliabilityScore < config.performanceThreshold),
      )
      .map((r) => ({
        recommendationId: `ipe-rec-${Date.now()}-${r.partnerReference}-${r.country}`,
        timestamp: new Date().toISOString(),
        companyReference: r.companyReference,
        partnerReference: r.partnerReference,
        country: r.country,
        partnershipCategory: r.partnershipCategory,
        riskLevel: r.riskLevel,
        recommendationSummary: `Address ${r.partnershipCategory} with ${r.partnerReference} in ${r.country} (perf=${r.performanceScore}, reliability=${r.reliabilityScore}) — no unvalidated approval`,
        structuralSignalOnly: true as const,
        neverApproveStrategicPartnershipsWithoutValidation: true as const,
        unvalidatedApprovalClaim: "none" as const,
      }));
  }
}
