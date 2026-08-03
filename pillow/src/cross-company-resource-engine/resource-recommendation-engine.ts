/** X2-11 — Resource Recommendation Engine. */

import type {
  ResourceAllocationRecord,
  ResourceConflictSignal,
  ResourceRecommendation,
} from "./types.js";

export class ResourceRecommendationEngine {
  recommend(input: {
    records: ResourceAllocationRecord[];
    conflicts: ResourceConflictSignal[];
    companyReference?: string;
    resourceIdentifier?: string;
  }): ResourceRecommendation[] {
    const recommendations: ResourceRecommendation[] = [];
    const scoped = input.records.filter((r) => {
      if (input.resourceIdentifier && r.resourceIdentifier !== input.resourceIdentifier) {
        return false;
      }
      if (
        input.companyReference &&
        r.owningCompany !== input.companyReference &&
        r.assignedCompany !== input.companyReference
      ) {
        return false;
      }
      return true;
    });

    for (const record of scoped) {
      if (record.allocationStatus === "idle") {
        recommendations.push({
          recommendationId: `ccre-rec-${Date.now()}-idle-${record.resourceAllocationId}`,
          timestamp: new Date().toISOString(),
          resourceIdentifier: record.resourceIdentifier,
          companyReference: record.owningCompany,
          recommendationType: "release_idle",
          rationale: `Resource ${record.resourceIdentifier} is idle (utilization=${record.utilizationScore}) — release or reallocate`,
          priority: "medium",
          structuralSignalOnly: true,
        });
      }
      if (
        record.allocationStatus === "available" &&
        record.utilizationScore >= 40 &&
        record.assignedCompany === record.owningCompany
      ) {
        recommendations.push({
          recommendationId: `ccre-rec-${Date.now()}-share-${record.resourceAllocationId}`,
          timestamp: new Date().toISOString(),
          resourceIdentifier: record.resourceIdentifier,
          companyReference: record.owningCompany,
          recommendationType: "share",
          rationale: `Share ${record.resourceCategory} ${record.resourceIdentifier} across portfolio companies`,
          priority: "low",
          structuralSignalOnly: true,
        });
      }
      if (record.protectedResource && !record.authorizedAllocation) {
        recommendations.push({
          recommendationId: `ccre-rec-${Date.now()}-auth-${record.resourceAllocationId}`,
          timestamp: new Date().toISOString(),
          resourceIdentifier: record.resourceIdentifier,
          companyReference: record.owningCompany,
          recommendationType: "authorize_protected",
          rationale: "Protected resource needs explicit authorization before cross-company allocation",
          priority: "high",
          structuralSignalOnly: true,
        });
      }
    }

    for (const conflict of input.conflicts) {
      recommendations.push({
        recommendationId: `ccre-rec-${Date.now()}-conflict-${conflict.conflictId}`,
        timestamp: new Date().toISOString(),
        resourceIdentifier: conflict.resourceIdentifier,
        companyReference: conflict.companiesInvolved[0] ?? null,
        recommendationType: "resolve_conflict",
        rationale: conflict.rationale,
        priority: conflict.severity === "high" ? "high" : "medium",
        structuralSignalOnly: true,
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        recommendationId: `ccre-rec-${Date.now()}-review`,
        timestamp: new Date().toISOString(),
        resourceIdentifier: null,
        companyReference: input.companyReference ?? null,
        recommendationType: "manual_review",
        rationale: "No automated optimization actions — portfolio resource posture is balanced",
        priority: "low",
        structuralSignalOnly: true,
      });
    }

    return recommendations;
  }
}
