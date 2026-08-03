/** X2-09 — Priority Recommendation Engine. */

import type {
  BusinessHealthRecord,
  ManagementPriorityRecommendation,
} from "./types.js";

export class PriorityRecommendationEngine {
  generate(records: BusinessHealthRecord[]): ManagementPriorityRecommendation[] {
    const out: ManagementPriorityRecommendation[] = [];
    const now = new Date().toISOString();

    for (const r of records) {
      if (
        r.recommendedManagementPriority === "maintain" &&
        !r.decliningDetected &&
        !r.highPerformingDetected
      ) {
        continue;
      }

      const type =
        r.decliningDetected
          ? "attention_declining_business"
          : r.highPerformingDetected
            ? "scale_high_performer"
            : "management_priority";

      out.push({
        recommendationId: `bhr-rec-${Date.now()}-${out.length}`,
        timestamp: now,
        businessHealthId: r.businessHealthId,
        companyReference: r.companyReference,
        source: "priority-recommendation-engine",
        recommendationType: type,
        rationale: `Composite ${r.compositeHealthScore}; enterprise rank #${r.overallEnterpriseRanking}; priority=${r.recommendedManagementPriority}`,
        priority: r.recommendedManagementPriority,
        structuralSignalOnly: true,
      });
    }

    return out;
  }
}
