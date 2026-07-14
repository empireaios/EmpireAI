/** T5-05 — Productivity improvement and acceleration recommendations. */

import type { ProductivityIntelligenceRecord } from "../productivity-intelligence-engine/types.js";
import type { OpportunityRecord } from "../ux-opportunity-discovery-engine/types.js";
import type { RawEvolutionCandidate } from "./types.js";

export class ProductivityImprovementEngine {
  analyze(input: {
    productivityRecords: ProductivityIntelligenceRecord[];
    opportunities: OpportunityRecord[];
  }): RawEvolutionCandidate[] {
    const candidates: RawEvolutionCandidate[] = [];

    for (const record of input.productivityRecords) {
      if (record.productivityObservations.includes("context_switching")) {
        candidates.push({
          evolutionCategory: "context_switching_reduction",
          workflowFrictionSummary: record.workflowPatternSummary,
          recommendedWorkflowImprovements: [
            "Group related tasks to minimize context switches",
            "Preserve workflow state across screen changes",
          ],
          estimatedProductivityBenefit: "Maintains focus and reduces re-orientation time",
          evidenceReferences: [...record.evidenceReferences, `productivity:${record.productivityId}`],
          confidenceScore: record.confidenceScore,
          impactScore: 0.76,
          sourceEngine: "PILLOW-PIE-001",
          sourceProductivityIntelligenceId: record.productivityId,
        });
      }

      if (record.productivityObservations.includes("productivity_trend")) {
        candidates.push({
          evolutionCategory: "productivity_improvement",
          workflowFrictionSummary: record.workflowPatternSummary,
          recommendedWorkflowImprovements: [
            "Address declining productivity trend with workflow audit",
            "Prioritize high-impact friction removals",
          ],
          estimatedProductivityBenefit: "Reverses productivity decline and restores workflow efficiency",
          evidenceReferences: [...record.evidenceReferences, `productivity:${record.productivityId}`],
          confidenceScore: record.confidenceScore,
          impactScore: 0.73,
          sourceEngine: "PILLOW-PIE-001",
          sourceProductivityIntelligenceId: record.productivityId,
        });
      }

      if (record.productivityObservations.includes("time_utilization")) {
        candidates.push({
          evolutionCategory: "workflow_acceleration",
          workflowFrictionSummary: record.bottleneckSummary,
          recommendedWorkflowImprovements: [
            "Optimize loading and waiting states",
            "Prefetch data for anticipated workflow steps",
          ],
          estimatedProductivityBenefit: "Accelerates workflow completion by reducing idle time",
          evidenceReferences: [...record.evidenceReferences, `productivity:${record.productivityId}`],
          confidenceScore: record.confidenceScore,
          impactScore: 0.77,
          sourceEngine: "PILLOW-PIE-001",
          sourceProductivityIntelligenceId: record.productivityId,
        });
      }
    }

    for (const opp of input.opportunities.filter(
      (o) => o.opportunityCategory === "performance_related_ux_improvement",
    )) {
      candidates.push({
        evolutionCategory: "user_effort_reduction",
        workflowFrictionSummary: opp.opportunitySummary,
        recommendedWorkflowImprovements: [
          "Reduce user effort during performance-sensitive workflow steps",
          "Optimize perceived performance of critical actions",
        ],
        estimatedProductivityBenefit: opp.expectedUxBenefit,
        evidenceReferences: [...opp.evidenceReferences, `opportunity:${opp.opportunityId}`],
        confidenceScore: opp.confidenceScore,
        impactScore: 0.71,
        sourceEngine: "PILLOW-UOD-001",
        sourceOpportunityId: opp.opportunityId,
        sourceUxAuditId: opp.sourceAuditId,
        sourceObservationId: opp.sourceObservationId,
      });
    }

    if (input.productivityRecords.length >= 2) {
      candidates.push({
        evolutionCategory: "workflow_consistency",
        workflowFrictionSummary: `Analyzed ${input.productivityRecords.length} productivity patterns for consistency gaps`,
        recommendedWorkflowImprovements: [
          "Standardize workflow patterns across similar tasks",
          "Align navigation paths for equivalent operations",
        ],
        estimatedProductivityBenefit: "Improves predictability and reduces learning overhead",
        evidenceReferences: input.productivityRecords
          .slice(0, 3)
          .map((r) => `productivity:${r.productivityId}`),
        confidenceScore: 0.65,
        impactScore: 0.6,
        sourceEngine: "PILLOW-WFE-001",
      });
    }

    return candidates;
  }
}
