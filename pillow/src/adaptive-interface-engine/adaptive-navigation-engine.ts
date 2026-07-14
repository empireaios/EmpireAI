/** T5-06 — Adaptive navigation recommendations. */

import type { WorkflowEvolutionRecord } from "../workflow-evolution-engine/types.js";
import type { OpportunityRecord } from "../ux-opportunity-discovery-engine/types.js";
import type { DetectedContext } from "./context-detection-engine.js";
import type { RawAdaptationCandidate } from "./types.js";

export class AdaptiveNavigationEngine {
  recommend(input: {
    context: DetectedContext;
    evolutionRecords: WorkflowEvolutionRecord[];
    opportunities: OpportunityRecord[];
  }): RawAdaptationCandidate[] {
    const candidates: RawAdaptationCandidate[] = [];

    for (const evo of input.evolutionRecords.filter((r) =>
      ["navigation_simplification", "click_reduction", "screen_transition_reduction"].includes(
        r.evolutionCategory,
      ),
    )) {
      candidates.push({
        adaptationCategory: "adaptive_navigation",
        currentWorkflowContext: input.context.workflowContext,
        recommendedInterfaceAdaptations: [],
        recommendedNavigationAdaptations: evo.recommendedWorkflowImprovements,
        recommendedWorkspaceAdaptations: [
          "Surface frequently used destinations for current workflow",
        ],
        expectedProductivityBenefit: evo.estimatedProductivityBenefit,
        evidenceReferences: [...evo.evidenceReferences, `evolution:${evo.workflowEvolutionId}`],
        confidenceScore: evo.confidenceScore,
        impactScore: 0.76,
        sourceEngine: "PILLOW-WFE-001",
        sourceWorkflowEvolutionId: evo.workflowEvolutionId,
      });
    }

    for (const opp of input.opportunities.filter(
      (o) => o.opportunityCategory === "navigation_improvement",
    )) {
      candidates.push({
        adaptationCategory: "adaptive_shortcut_placement",
        currentWorkflowContext: input.context.workflowContext,
        recommendedInterfaceAdaptations: [
          "Place contextual shortcuts for active workflow",
        ],
        recommendedNavigationAdaptations: [
          `Shortcut navigation for: ${opp.opportunitySummary}`,
        ],
        recommendedWorkspaceAdaptations: [],
        expectedProductivityBenefit: opp.expectedUxBenefit,
        evidenceReferences: [...opp.evidenceReferences, `opportunity:${opp.opportunityId}`],
        confidenceScore: opp.confidenceScore,
        impactScore: 0.7,
        sourceEngine: "PILLOW-UOD-001",
        sourceOpportunityId: opp.opportunityId,
      });
    }

    return candidates;
  }
}
