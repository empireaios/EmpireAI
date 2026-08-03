/** X3-19 — Balance Recommendation Engine. */

import type { SelfBalancingEnterpriseConfiguration } from "./configuration.js";
import type {
  SelfBalancingRecommendation,
  SelfBalancingRecord,
} from "./types.js";

export class BalanceRecommendationEngine {
  generate(
    records: SelfBalancingRecord[],
    config: SelfBalancingEnterpriseConfiguration,
  ): SelfBalancingRecommendation[] {
    // Never reallocate protected resources beyond approval policies.
    const eligible = records.filter(
      (r) =>
        r.validationStatus === "passed" &&
        r.balanceScore >= config.balanceScoreThreshold &&
        r.balanceScore >= config.highScoreThreshold &&
        r.neverReallocateProtectedResourcesBeyondApprovalPolicies === true &&
        r.policyGatedReallocation === true,
    );

    if (eligible.length === 0) {
      return [
        {
          recommendationId: `sbe-rec-${Date.now()}-hold`,
          timestamp: new Date().toISOString(),
          companyReference: records[0]?.companyReference ?? "company-default",
          resourceCategory: records[0]?.resourceCategory ?? "operational",
          recommendationSummary:
            "Hold reallocation — validated structural scores do not clear thresholds (never reallocate protected resources beyond approval policies)",
          balanceScore: records[0]?.balanceScore ?? 0,
          currentAllocation: records[0]?.currentAllocation ?? 0,
          recommendedAllocation: records[0]?.recommendedAllocation ?? 0,
          expectedImprovement:
            records[0]?.expectedImprovement ??
            "No eligible policy-gated reallocation recommendations",
          structuralSignalOnly: true,
          neverReallocateProtectedResourcesBeyondApprovalPolicies: true,
          policyGatedReallocation: true,
        },
      ];
    }

    return eligible.slice(0, 8).map((record, index) => {
      const posture =
        record.balanceScore >= config.criticalScoreThreshold
          ? "stage-policy-gated-rebalance"
          : record.balanceScore >= config.highScoreThreshold
            ? "prepare-rebalance"
            : "observe";
      const summary = `${posture} ${record.resourceCategory} — score ${record.balanceScore}% · never reallocate protected resources beyond approval policies`;
      return {
        recommendationId: `sbe-rec-${Date.now()}-${index}`,
        timestamp: new Date().toISOString(),
        companyReference: record.companyReference,
        resourceCategory: String(record.resourceCategory),
        recommendationSummary: summary,
        balanceScore: record.balanceScore,
        currentAllocation: record.currentAllocation,
        recommendedAllocation: record.recommendedAllocation,
        expectedImprovement: record.expectedImprovement,
        structuralSignalOnly: true,
        neverReallocateProtectedResourcesBeyondApprovalPolicies: true,
        policyGatedReallocation: true,
      };
    });
  }
}
