/** T5-08 — Executive widget recommendations. */

import type { UxEvolutionRecord } from "../continuous-ux-evolution-engine/types.js";
import type { OpportunityRecord } from "../ux-opportunity-discovery-engine/types.js";
import type { ExecutiveContext, RawWorkspaceCandidate } from "./types.js";

export class ExecutiveWidgetManager {
  recommend(input: {
    context: ExecutiveContext;
    uxEvolutionRecords: UxEvolutionRecord[];
    opportunities: OpportunityRecord[];
  }): RawWorkspaceCandidate[] {
    const candidates: RawWorkspaceCandidate[] = [];

    for (const opp of input.opportunities.filter((o) =>
      ["dashboard_improvement", "workflow_improvement", "productivity_improvement"].includes(
        o.opportunityCategory,
      ),
    )) {
      candidates.push({
        workspaceCategory: "analytics_dashboard",
        activeMissionContext: input.context.activeMissionContext,
        executivePriorities: input.context.executivePriorities,
        recommendedDashboardLayout: [
          "Analytics panel with opportunity-driven widgets",
        ],
        recommendedWorkspaceConfiguration: [
          "Place analytics widgets in executive sidebar",
        ],
        recommendedWidgets: [
          `${opp.opportunityCategory.replace(/_/g, " ")} widget`,
          `Insight: ${opp.opportunitySummary}`,
        ],
        recommendedShortcuts: [],
        expectedProductivityBenefit: opp.expectedUxBenefit,
        evidenceReferences: [...opp.evidenceReferences, `uod:${opp.opportunityId}`],
        confidenceScore: opp.confidenceScore,
        impactScore: 0.7,
        sourceEngine: "PILLOW-UOD-001",
      });
    }

    for (const cue of input.uxEvolutionRecords.slice(0, 3)) {
      candidates.push({
        workspaceCategory: "role_based_workspace",
        activeMissionContext: input.context.activeMissionContext,
        executivePriorities: input.context.executivePriorities,
        recommendedDashboardLayout: ["Executive role-based widget grid"],
        recommendedWorkspaceConfiguration: [
          "Configure widgets for Grand King executive role",
        ],
        recommendedWidgets: cue.recommendedUxImprovements
          .slice(0, 3)
          .map((i) => `Widget: ${i}`),
        recommendedShortcuts: [],
        expectedProductivityBenefit: cue.expectedUxBenefit,
        evidenceReferences: [...cue.evidenceReferences, `cue:${cue.uxEvolutionId}`],
        confidenceScore: cue.confidenceScore,
        impactScore: 0.68,
        sourceEngine: "PILLOW-CUE-001",
        sourceUxEvolutionId: cue.uxEvolutionId,
      });
    }

    return candidates;
  }
}
