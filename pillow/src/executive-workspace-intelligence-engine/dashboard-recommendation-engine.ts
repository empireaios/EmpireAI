/** T5-08 — Dashboard recommendation from UX evolution and adaptive interface. */

import { appendWorkspaceLog } from "./ewi-logging.js";
import type { UxEvolutionRecord } from "../continuous-ux-evolution-engine/types.js";
import type { AdaptiveInterfaceRecord } from "../adaptive-interface-engine/types.js";
import type { ExecutiveContext, RawWorkspaceCandidate } from "./types.js";

export class DashboardRecommendationEngine {
  recommend(input: {
    context: ExecutiveContext;
    uxEvolutionRecords: UxEvolutionRecord[];
    adaptiveRecords: AdaptiveInterfaceRecord[];
  }): RawWorkspaceCandidate[] {
    const candidates: RawWorkspaceCandidate[] = [];

    for (const cue of input.uxEvolutionRecords) {
      const category = this.mapEvolutionToDashboard(cue.evolutionCategory);
      candidates.push({
        workspaceCategory: category,
        activeMissionContext: input.context.activeMissionContext,
        executivePriorities: input.context.executivePriorities,
        recommendedDashboardLayout: [
          `Dashboard panel for ${cue.evolutionCategory.replace(/_/g, " ")}`,
          ...cue.recommendedUxImprovements.slice(0, 2).map((i) => `Layout: ${i}`),
        ],
        recommendedWorkspaceConfiguration: [
          "Arrange dashboard tiles by evolution priority",
        ],
        recommendedWidgets: [
          `${cue.evolutionCategory.replace(/_/g, " ")} status widget`,
        ],
        recommendedShortcuts: [],
        expectedProductivityBenefit: cue.expectedUxBenefit,
        evidenceReferences: [...cue.evidenceReferences, `cue:${cue.uxEvolutionId}`],
        confidenceScore: cue.confidenceScore,
        impactScore: 0.78,
        sourceEngine: "PILLOW-CUE-001",
        sourceUxEvolutionId: cue.uxEvolutionId,
      });
    }

    for (const aie of input.adaptiveRecords) {
      candidates.push({
        workspaceCategory: "executive_dashboard",
        activeMissionContext: input.context.activeMissionContext,
        executivePriorities: input.context.executivePriorities,
        recommendedDashboardLayout: [
          "Executive overview with adaptive interface insights",
          ...aie.recommendedInterfaceAdaptations.slice(0, 2),
        ],
        recommendedWorkspaceConfiguration: [
          "Apply adaptive workspace organization from interface intelligence",
        ],
        recommendedWidgets: [
          "Adaptive interface summary widget",
          "Context-aware status panel",
        ],
        recommendedShortcuts: aie.recommendedNavigationAdaptations.slice(0, 3),
        expectedProductivityBenefit: aie.expectedProductivityBenefit,
        evidenceReferences: [...aie.evidenceReferences, `aie:${aie.adaptiveInterfaceId}`],
        confidenceScore: aie.confidenceScore,
        impactScore: 0.74,
        sourceEngine: "PILLOW-AIE-001",
        sourceAdaptiveInterfaceId: aie.adaptiveInterfaceId,
      });
    }

    appendWorkspaceLog({
      event: "dashboard_recommendation",
      level: "info",
      details: `Generated ${candidates.length} dashboard recommendations`,
    });

    return candidates;
  }

  private mapEvolutionToDashboard(
    category: UxEvolutionRecord["evolutionCategory"],
  ): RawWorkspaceCandidate["workspaceCategory"] {
    const map: Partial<
      Record<UxEvolutionRecord["evolutionCategory"], RawWorkspaceCandidate["workspaceCategory"]>
    > = {
      workflow_evolution: "workflow_dashboard",
      productivity_evolution: "productivity_dashboard",
      navigation_evolution: "operations_dashboard",
      layout_evolution: "workspace_layout_optimization",
      accessibility_evolution: "executive_dashboard",
      visual_consistency_evolution: "executive_dashboard",
      component_evolution: "operations_dashboard",
      dashboard_evolution: "analytics_dashboard",
      workspace_evolution: "context_aware_workspace",
      context_aware_evolution: "context_aware_workspace",
      user_experience_evolution: "executive_dashboard",
      operational_efficiency_evolution: "operational_workspace_optimization",
    };
    return map[category] ?? "executive_dashboard";
  }
}
