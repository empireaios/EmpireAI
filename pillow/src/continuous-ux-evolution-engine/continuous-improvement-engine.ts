/** T5-07 — Continuous improvement from T5-06 adaptive interface records. */

import type { AdaptiveInterfaceRecord } from "../adaptive-interface-engine/types.js";
import type { RawEvolutionCandidate } from "./types.js";

export class ContinuousImprovementEngine {
  discover(input: {
    adaptiveRecords: AdaptiveInterfaceRecord[];
  }): RawEvolutionCandidate[] {
    const candidates: RawEvolutionCandidate[] = [];

    for (const record of input.adaptiveRecords) {
      const category = this.mapAdaptationToEvolution(record.adaptationCategory);
      const improvements = [
        ...record.recommendedInterfaceAdaptations,
        ...record.recommendedNavigationAdaptations,
        ...record.recommendedWorkspaceAdaptations,
      ].filter(Boolean);

      if (!improvements.length) continue;

      candidates.push({
        evolutionCategory: category,
        recommendedUxImprovements: improvements.map(
          (i) => `Evolve from adaptive insight: ${i}`,
        ),
        expectedUxBenefit: record.expectedProductivityBenefit,
        evidenceReferences: [
          ...record.evidenceReferences,
          `adaptive:${record.adaptiveInterfaceId}`,
        ],
        confidenceScore: record.confidenceScore,
        impactScore: 0.76,
        sourceEngine: "PILLOW-AIE-001",
        sourceAdaptiveInterfaceId: record.adaptiveInterfaceId,
        sourceWorkflowEvolutionId: record.sourceWorkflowEvolutionId,
        sourceProductivityIntelligenceId: record.sourceProductivityIntelligenceId,
        sourceOpportunityId: record.sourceOpportunityId,
      });
    }

    return candidates;
  }

  private mapAdaptationToEvolution(
    category: AdaptiveInterfaceRecord["adaptationCategory"],
  ): RawEvolutionCandidate["evolutionCategory"] {
    const map: Partial<
      Record<AdaptiveInterfaceRecord["adaptationCategory"], RawEvolutionCandidate["evolutionCategory"]>
    > = {
      adaptive_layout: "layout_evolution",
      adaptive_navigation: "navigation_evolution",
      adaptive_workspace: "workspace_evolution",
      adaptive_dashboard: "dashboard_evolution",
      adaptive_shortcut_placement: "navigation_evolution",
      adaptive_workflow_presentation: "workflow_evolution",
      adaptive_information_hierarchy: "layout_evolution",
      adaptive_task_prioritization: "productivity_evolution",
      adaptive_visual_emphasis: "visual_consistency_evolution",
      adaptive_panel_organization: "workspace_evolution",
      adaptive_operational_context: "context_aware_evolution",
      adaptive_productivity_optimization: "operational_efficiency_evolution",
    };
    return map[category] ?? "user_experience_evolution";
  }
}
