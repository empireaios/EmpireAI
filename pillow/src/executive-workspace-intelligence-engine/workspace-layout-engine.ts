/** T5-08 — Workspace layout recommendations. */

import type { AdaptiveInterfaceRecord } from "../adaptive-interface-engine/types.js";
import type { ExecutiveContext, RawWorkspaceCandidate } from "./types.js";

export class WorkspaceLayoutEngine {
  recommend(input: {
    context: ExecutiveContext;
    adaptiveRecords: AdaptiveInterfaceRecord[];
  }): RawWorkspaceCandidate[] {
    const candidates: RawWorkspaceCandidate[] = [];

    for (const aie of input.adaptiveRecords.filter((r) =>
      ["adaptive_workspace", "adaptive_panel_organization", "adaptive_layout"].includes(
        r.adaptationCategory,
      ),
    )) {
      candidates.push({
        workspaceCategory: "workspace_layout_optimization",
        activeMissionContext: input.context.activeMissionContext,
        executivePriorities: input.context.executivePriorities,
        recommendedDashboardLayout: [
          "Three-column executive layout with mission focus center",
        ],
        recommendedWorkspaceConfiguration: [
          ...aie.recommendedWorkspaceAdaptations,
          ...aie.recommendedInterfaceAdaptations.slice(0, 2),
        ],
        recommendedWidgets: [
          "Mission focus panel",
          "Operational summary panel",
        ],
        recommendedShortcuts: [],
        expectedProductivityBenefit: aie.expectedProductivityBenefit,
        evidenceReferences: [...aie.evidenceReferences, `aie:${aie.adaptiveInterfaceId}`],
        confidenceScore: aie.confidenceScore,
        impactScore: 0.72,
        sourceEngine: "PILLOW-AIE-001",
        sourceAdaptiveInterfaceId: aie.adaptiveInterfaceId,
      });
    }

    if (!candidates.length) {
      candidates.push({
        workspaceCategory: "priority_based_workspace",
        activeMissionContext: input.context.activeMissionContext,
        executivePriorities: input.context.executivePriorities,
        recommendedDashboardLayout: [
          "Priority-ranked executive workspace with mission header",
        ],
        recommendedWorkspaceConfiguration: [
          "Organize panels by executive priority order",
          `Context: ${input.context.operationalContext}`,
        ],
        recommendedWidgets: ["Executive priority widget"],
        recommendedShortcuts: [],
        expectedProductivityBenefit: "Aligns workspace layout with executive priorities",
        evidenceReferences: input.context.evidenceReferences,
        confidenceScore: input.context.confidenceScore,
        impactScore: 0.6,
        sourceEngine: "PILLOW-EWI-001",
      });
    }

    return candidates;
  }
}
