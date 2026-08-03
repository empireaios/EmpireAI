/** X2-17 — Lifecycle Recommendation Engine. */

import type { LifecycleRecommendation, LifecycleRecord } from "./types.js";

export class LifecycleRecommendationEngine {
  recommend(records: LifecycleRecord[], companyReference?: string): LifecycleRecommendation[] {
    const scoped = records.filter((r) =>
      companyReference ? r.companyReference === companyReference : true,
    );
    return scoped.map((record) => {
      const pending = record.lifecycleStatus === "transition_recommended" ||
        record.lifecycleStatus === "transition_pending";
      return {
        recommendationId: `clm-rec-${Date.now()}-${record.lifecycleRecordId}`,
        timestamp: new Date().toISOString(),
        companyReference: record.companyReference,
        fromStage: record.previousLifecycleStage ?? record.currentLifecycleStage,
        toStage: pending
          ? record.currentLifecycleStage
          : null,
        rationale: record.transitionRecommendation,
        priority: pending ? "high" : record.maturityScore < 30 ? "medium" : "low",
        requiresApproval: record.requiresApproval || pending,
        autoTransitionBlocked: true as const,
        structuralSignalOnly: true as const,
      };
    });
  }
}
