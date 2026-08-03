import type { CapitalAllocationRecord, CapitalRecommendation } from "./types.js";
export class CapitalRecommendationEngine {
  recommend(records: CapitalAllocationRecord[]): CapitalRecommendation[] {
    return [...records].filter((record) => record.validationStatus !== "failed").sort((a, b) => b.allocationPriority - a.allocationPriority).map((record) => ({
      recommendationId: `eca-rec-${record.capitalAllocationId}`, timestamp: new Date().toISOString(), companyReference: record.companyReference,
      recommendationSummary: record.recommendationSummary, allocationPriority: record.allocationPriority, capitalAllocationId: record.capitalAllocationId,
      structuralSignalOnly: true, neverExecuteCapitalTransfersAutomaticallyWithoutApprovedGovernance: true, approvedForTransfer: false, unvalidatedClaim: "none",
    }));
  }
}
