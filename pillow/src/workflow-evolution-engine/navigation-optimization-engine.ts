/** T5-05 — Navigation optimization recommendations. */

import type { ProductivityIntelligenceRecord } from "../productivity-intelligence-engine/types.js";
import type { OpportunityRecord } from "../ux-opportunity-discovery-engine/types.js";
import type { ObservationRecord } from "../continuous-screen-observation-engine/types.js";
import type { RawEvolutionCandidate } from "./types.js";

export class NavigationOptimizationEngine {
  analyze(input: {
    productivityRecords: ProductivityIntelligenceRecord[];
    opportunities: OpportunityRecord[];
    observation: ObservationRecord | null;
  }): RawEvolutionCandidate[] {
    const candidates: RawEvolutionCandidate[] = [];

    for (const opp of input.opportunities.filter(
      (o) => o.opportunityCategory === "navigation_improvement",
    )) {
      candidates.push({
        evolutionCategory: "navigation_simplification",
        workflowFrictionSummary: opp.opportunitySummary,
        recommendedWorkflowImprovements: [
          "Reduce navigation depth to target screens",
          "Add direct access shortcuts for frequent destinations",
        ],
        estimatedProductivityBenefit: "Cuts navigation overhead and accelerates task access",
        evidenceReferences: [...opp.evidenceReferences, `opportunity:${opp.opportunityId}`],
        confidenceScore: opp.confidenceScore,
        impactScore: 0.74,
        sourceEngine: "PILLOW-UOD-001",
        sourceOpportunityId: opp.opportunityId,
        sourceUxAuditId: opp.sourceAuditId,
        sourceObservationId: opp.sourceObservationId,
      });
    }

    for (const record of input.productivityRecords) {
      if (record.productivityObservations.includes("screen_transition_pattern")) {
        candidates.push({
          evolutionCategory: "screen_transition_reduction",
          workflowFrictionSummary: record.navigationPatternSummary,
          recommendedWorkflowImprovements: [
            "Keep related tasks on single screen",
            "Reduce cross-screen navigation during workflow",
          ],
          estimatedProductivityBenefit: "Minimizes context loss from screen transitions",
          evidenceReferences: [...record.evidenceReferences, `productivity:${record.productivityId}`],
          confidenceScore: record.confidenceScore,
          impactScore: 0.68,
          sourceEngine: "PILLOW-PIE-001",
          sourceProductivityIntelligenceId: record.productivityId,
          sourceObservationId: record.sourceObservationId,
        });
      }

      if (record.productivityObservations.includes("navigation_pattern")) {
        candidates.push({
          evolutionCategory: "click_reduction",
          workflowFrictionSummary: record.navigationPatternSummary,
          recommendedWorkflowImprovements: [
            "Flatten navigation hierarchy",
            "Surface primary actions without extra clicks",
          ],
          estimatedProductivityBenefit: "Reduces clicks required to complete common tasks",
          evidenceReferences: [...record.evidenceReferences, `productivity:${record.productivityId}`],
          confidenceScore: record.confidenceScore,
          impactScore: 0.7,
          sourceEngine: "PILLOW-PIE-001",
          sourceProductivityIntelligenceId: record.productivityId,
        });
      }
    }

    if (input.observation?.detectedStateChanges?.length) {
      const transitions = input.observation.detectedStateChanges.filter((c) =>
        c.startsWith("screen_changed:"),
      );
      if (transitions.length > 2) {
        candidates.push({
          evolutionCategory: "screen_transition_reduction",
          workflowFrictionSummary: `${transitions.length} screen transitions detected in observation window`,
          recommendedWorkflowImprovements: [
            "Consolidate multi-screen workflow into fewer views",
            "Use inline panels instead of full screen changes",
          ],
          estimatedProductivityBenefit: "Reduces navigation friction during active workflows",
          evidenceReferences: [`observation:${input.observation.observationId}:transitions`],
          confidenceScore: input.observation.confidenceScore,
          impactScore: 0.65,
          sourceEngine: "PILLOW-CSO-001",
          sourceObservationId: input.observation.observationId,
        });
      }
    }

    return candidates;
  }
}
