/** T5-05 — Workflow simplification recommendations from productivity patterns. */

import type { ProductivityIntelligenceRecord } from "../productivity-intelligence-engine/types.js";
import type { RawEvolutionCandidate } from "./types.js";

export class WorkflowSimplificationEngine {
  analyze(productivityRecords: ProductivityIntelligenceRecord[]): RawEvolutionCandidate[] {
    const candidates: RawEvolutionCandidate[] = [];

    for (const record of productivityRecords) {
      if (record.productivityObservations.includes("task_repetition")) {
        candidates.push({
          evolutionCategory: "task_reduction",
          workflowFrictionSummary: record.taskSequenceSummary,
          recommendedWorkflowImprovements: [
            "Automate repeated task sequence",
            "Provide batch action for recurring operations",
            "Add shortcut for frequently repeated workflow step",
          ],
          estimatedProductivityBenefit: "Eliminates redundant manual steps and saves time per session",
          evidenceReferences: [...record.evidenceReferences, `productivity:${record.productivityId}`],
          confidenceScore: record.confidenceScore,
          impactScore: 0.78,
          sourceEngine: "PILLOW-PIE-001",
          sourceProductivityIntelligenceId: record.productivityId,
          sourceOpportunityId: record.sourceOpportunityId,
          sourceUxAuditId: record.sourceAuditId,
          sourceObservationId: record.sourceObservationId,
        });
      }

      if (record.productivityObservations.includes("workflow_pattern")) {
        candidates.push({
          evolutionCategory: "workflow_simplification",
          workflowFrictionSummary: record.workflowPatternSummary,
          recommendedWorkflowImprovements: [
            "Merge adjacent workflow stages",
            "Reduce intermediate confirmation steps",
          ],
          estimatedProductivityBenefit: "Shortens workflow path and reduces cognitive overhead",
          evidenceReferences: [...record.evidenceReferences, `productivity:${record.productivityId}`],
          confidenceScore: record.confidenceScore * 0.95,
          impactScore: 0.72,
          sourceEngine: "PILLOW-PIE-001",
          sourceProductivityIntelligenceId: record.productivityId,
          sourceUxAuditId: record.sourceAuditId,
          sourceObservationId: record.sourceObservationId,
        });
      }
    }

    return candidates;
  }
}
