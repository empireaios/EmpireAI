/** X2-05 — Capital recommendation engine. */

import { appendCdeLog } from "./cde-logging.js";
import type {
  CapitalAllocationRecord,
  CapitalRecommendation,
  CapitalRiskSignal,
} from "./types.js";

export class CapitalRecommendationEngine {
  recommend(input: {
    allocations: CapitalAllocationRecord[];
    risks: CapitalRiskSignal[];
    companyReference?: string;
  }): CapitalRecommendation[] {
    const targets = input.companyReference
      ? input.allocations.filter((a) => a.companyReference === input.companyReference)
      : input.allocations;

    const recommendations: CapitalRecommendation[] = [];

    for (const alloc of targets) {
      if (alloc.requiresManualApproval) {
        recommendations.push(
          this.make(alloc.companyReference, alloc.capitalAllocationId, "manual_review", "high", "Allocation exceeds auto-approval policy — manual review required"),
        );
      } else if (alloc.autoApproved && alloc.expectedRoi >= 25) {
        recommendations.push(
          this.make(alloc.companyReference, alloc.capitalAllocationId, "allocate", "high", "High ROI opportunity within approval policy"),
        );
      } else if (alloc.expectedRoi < 10) {
        recommendations.push(
          this.make(alloc.companyReference, alloc.capitalAllocationId, "defer", "medium", "Expected ROI below portfolio preference"),
        );
      } else {
        recommendations.push(
          this.make(alloc.companyReference, alloc.capitalAllocationId, "allocate", "medium", "Allocation aligns with structural ROI targets"),
        );
      }
    }

    for (const risk of input.risks) {
      if (risk.riskType === "shortage") {
        recommendations.push(
          this.make(null, null, "increase_pool", "high", risk.rationale),
        );
      } else if (risk.riskType === "concentration") {
        recommendations.push(
          this.make(risk.companyReference, null, "diversify", "high", risk.rationale),
        );
      } else if (risk.riskType === "low_roi") {
        recommendations.push(
          this.make(risk.companyReference, null, "reject", "medium", risk.rationale),
        );
      }
    }

    if (recommendations.length === 0) {
      recommendations.push(
        this.make(input.companyReference ?? null, null, "allocate", "low", "Continue evaluating funding requirements against pool capacity"),
      );
    }

    appendCdeLog({
      event: "recommendation_generation",
      level: "info",
      details: `Generated ${recommendations.length} capital recommendation(s)`,
    });

    return recommendations;
  }

  private make(
    companyReference: string | null,
    capitalAllocationId: string | null,
    recommendationType: CapitalRecommendation["recommendationType"],
    priority: CapitalRecommendation["priority"],
    rationale: string,
  ): CapitalRecommendation {
    return {
      recommendationId: `cde-rec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      companyReference,
      capitalAllocationId,
      recommendationType,
      rationale,
      priority,
      structuralSignalOnly: true,
    };
  }
}
