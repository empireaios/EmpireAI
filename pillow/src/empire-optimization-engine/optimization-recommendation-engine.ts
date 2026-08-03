import type { OptimizationRecord, OptimizationRecommendation } from "./types.js";
export class OptimizationRecommendationEngine {
  recommend(records: OptimizationRecord[]): OptimizationRecommendation[] {
    return records.filter((record) => record.validationStatus !== "failed").sort((a, b) => b.priorityScore - a.priorityScore).map((record) => ({
      recommendationId: `eoe-rec-${record.optimizationId}`, timestamp: new Date().toISOString(), companyReference: record.companyReference,
      recommendationSummary: record.recommendationSummary, priorityScore: record.priorityScore, optimizationId: record.optimizationId,
      structuralSignalOnly: true, neverExecuteUnapprovedOptimizationActionsAutomatically: true, approvedForExecution: false, unvalidatedClaim: "none",
    }));
  }
}
