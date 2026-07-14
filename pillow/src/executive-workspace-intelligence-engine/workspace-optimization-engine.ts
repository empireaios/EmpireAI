/** T5-08 — Workspace optimization from adaptive navigation and shortcuts. */

import type { AdaptiveInterfaceRecord } from "../adaptive-interface-engine/types.js";
import type { UxAuditRecord } from "../autonomous-ux-audit-engine/types.js";
import type { ExecutiveContext, RawWorkspaceCandidate } from "./types.js";

export class WorkspaceOptimizationEngine {
  optimize(input: {
    context: ExecutiveContext;
    adaptiveRecords: AdaptiveInterfaceRecord[];
    audit: UxAuditRecord | null;
  }): RawWorkspaceCandidate[] {
    const candidates: RawWorkspaceCandidate[] = [];

    for (const aie of input.adaptiveRecords.filter(
      (r) =>
        r.recommendedNavigationAdaptations.length > 0 ||
        r.adaptationCategory === "adaptive_shortcut_placement",
    )) {
      candidates.push({
        workspaceCategory: "executive_shortcut_organization",
        activeMissionContext: input.context.activeMissionContext,
        executivePriorities: input.context.executivePriorities,
        recommendedDashboardLayout: [
          "Executive command bar with prioritized shortcuts",
        ],
        recommendedWorkspaceConfiguration: [
          "Group shortcuts by mission and operational context",
        ],
        recommendedWidgets: ["Shortcut usage analytics widget"],
        recommendedShortcuts: aie.recommendedNavigationAdaptations.slice(0, 5),
        expectedProductivityBenefit: "Reduces navigation time for executive workflows",
        evidenceReferences: [...aie.evidenceReferences, `aie:${aie.adaptiveInterfaceId}`],
        confidenceScore: aie.confidenceScore,
        impactScore: 0.75,
        sourceEngine: "PILLOW-AIE-001",
        sourceAdaptiveInterfaceId: aie.adaptiveInterfaceId,
      });
    }

    const navIssues = (input.audit?.detectedUxIssues ?? []).filter(
      (i) => i.category === "navigation_issue",
    );
    for (const issue of navIssues) {
      candidates.push({
        workspaceCategory: "operations_dashboard",
        activeMissionContext: input.context.activeMissionContext,
        executivePriorities: input.context.executivePriorities,
        recommendedDashboardLayout: [
          "Operations overview with navigation health panel",
        ],
        recommendedWorkspaceConfiguration: [
          `Address navigation issue: ${issue.description}`,
        ],
        recommendedWidgets: ["Navigation health widget"],
        recommendedShortcuts: ["Reorganize executive navigation paths"],
        expectedProductivityBenefit: "Improves operational navigation efficiency",
        evidenceReferences: [issue.evidenceReference],
        confidenceScore: issue.detectionConfidence,
        impactScore: 0.7,
        sourceEngine: issue.sourceEngine,
      });
    }

    candidates.push({
      workspaceCategory: "operational_workspace_optimization",
      activeMissionContext: input.context.activeMissionContext,
      executivePriorities: input.context.executivePriorities,
      recommendedDashboardLayout: [
        "Operational summary dashboard with mission status",
      ],
      recommendedWorkspaceConfiguration: [
        input.context.operationalContext,
        "Surface operational summaries in executive workspace header",
      ],
      recommendedWidgets: [
        "Mission status widget",
        "Operational context summary",
      ],
      recommendedShortcuts: [
        "Quick access to active mission dashboard",
      ],
      expectedProductivityBenefit: "Provides executive operational visibility",
      evidenceReferences: input.context.evidenceReferences,
      confidenceScore: input.context.confidenceScore,
      impactScore: 0.65,
      sourceEngine: "PILLOW-EWI-001",
    });

    return candidates;
  }
}
