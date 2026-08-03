/** X3-09 — Executive Recommendation Engine. */

import type { ExecutiveScalingDashboardConfiguration } from "./configuration.js";
import type {
  ExecutiveDashboardSnapshot,
  ExecutiveScalingRecommendation,
} from "./types.js";

export class ExecutiveRecommendationEngine {
  generate(
    snapshots: ExecutiveDashboardSnapshot[],
    config: ExecutiveScalingDashboardConfiguration,
  ): ExecutiveScalingRecommendation[] {
    if (!config.recommendationRulesEnabled) {
      return [
        {
          recommendationId: `esd-rec-${Date.now()}-disabled`,
          timestamp: new Date().toISOString(),
          companyReference: snapshots[0]?.companyReference ?? "company-default",
          recommendationSummary: "Recommendation rules disabled — hold executive scaling actions",
          scalingReadinessScore: 0,
          opportunityScore: 0,
          capacityScore: 0,
          structuralSignalOnly: true,
          neverExposeRestrictedEnterpriseInformation: true,
        },
      ];
    }

    const latest = snapshots[snapshots.length - 1];
    if (!latest) {
      return [
        {
          recommendationId: `esd-rec-${Date.now()}-empty`,
          timestamp: new Date().toISOString(),
          companyReference: "company-default",
          recommendationSummary:
            "Hold scaling recommendations — no dashboard snapshot available",
          scalingReadinessScore: 0,
          opportunityScore: 0,
          capacityScore: 0,
          structuralSignalOnly: true,
          neverExposeRestrictedEnterpriseInformation: true,
        },
      ];
    }

    const scaling = latest.scalingSummary.readinessScore;
    const opportunity = latest.opportunitySummary.readinessScore;
    const capacity = latest.capacitySummary.readinessScore;
    const financial = latest.financialSummary.readinessScore;
    const workforce = latest.workforceSummary.readinessScore;

    const eligible =
      scaling >= config.minScalingReadiness &&
      opportunity >= config.minOpportunityScore &&
      capacity >= config.minCapacityScore &&
      financial >= config.minFinancialScore &&
      workforce >= config.minWorkforceScore;

    if (!eligible) {
      return [
        {
          recommendationId: `esd-rec-${Date.now()}-hold`,
          timestamp: new Date().toISOString(),
          companyReference: latest.companyReference,
          recommendationSummary:
            "Hold executive scaling actions — validated readiness does not clear scaling/opportunity/capacity/financial/workforce thresholds",
          scalingReadinessScore: scaling,
          opportunityScore: opportunity,
          capacityScore: capacity,
          structuralSignalOnly: true,
          neverExposeRestrictedEnterpriseInformation: true,
        },
      ];
    }

    return [
      {
        recommendationId: `esd-rec-${Date.now()}-0`,
        timestamp: new Date().toISOString(),
        companyReference: latest.companyReference,
        recommendationSummary: `Cautious scale visibility — scaling ${scaling}, opportunity ${opportunity}, capacity ${capacity}`,
        scalingReadinessScore: scaling,
        opportunityScore: opportunity,
        capacityScore: capacity,
        structuralSignalOnly: true,
        neverExposeRestrictedEnterpriseInformation: true,
      },
      {
        recommendationId: `esd-rec-${Date.now()}-1`,
        timestamp: new Date().toISOString(),
        companyReference: latest.companyReference,
        recommendationSummary: `Maintain cockpit refresh cadence — financial ${financial}, workforce ${workforce}`,
        scalingReadinessScore: scaling,
        opportunityScore: opportunity,
        capacityScore: capacity,
        structuralSignalOnly: true,
        neverExposeRestrictedEnterpriseInformation: true,
      },
    ];
  }
}
