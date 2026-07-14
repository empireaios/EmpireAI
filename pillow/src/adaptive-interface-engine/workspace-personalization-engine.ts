/** T5-06 — Workspace personalization recommendations. */

import type { ProductivityIntelligenceRecord } from "../productivity-intelligence-engine/types.js";
import type { AdaptiveInterfaceEngineBundle } from "./types.js";
import type { DetectedContext } from "./context-detection-engine.js";
import type { RawAdaptationCandidate } from "./types.js";
import { appendAdaptiveLog } from "./adaptive-logging.js";

export class WorkspacePersonalizationEngine {
  recommend(input: {
    engines: AdaptiveInterfaceEngineBundle;
    context: DetectedContext;
    productivityRecords: ProductivityIntelligenceRecord[];
  }): { candidates: RawAdaptationCandidate[]; recurringPatterns: string[] } {
    const candidates: RawAdaptationCandidate[] = [];
    const recurringPatterns: string[] = [];

    try {
      const tracking = input.engines.interactionTracking?.getState();
      const events = tracking?.recentEvents ?? [];
      const screenUsage = new Map<string, number>();
      for (const event of events) {
        const screen = event.currentScreenId ?? "unknown";
        screenUsage.set(screen, (screenUsage.get(screen) ?? 0) + 1);
      }
      for (const [screen, count] of screenUsage) {
        if (count >= 2) recurringPatterns.push(`frequent_screen:${screen}:${count}`);
      }
      if (recurringPatterns.length > 0) {
        candidates.push({
          adaptationCategory: "adaptive_workspace",
          currentWorkflowContext: input.context.workflowContext,
          recommendedInterfaceAdaptations: [],
          recommendedNavigationAdaptations: [],
          recommendedWorkspaceAdaptations: [
            "Prioritize frequently used screens in workspace layout",
            "Pin recurring workflow panels for quick access",
          ],
          expectedProductivityBenefit: "Reduces navigation to commonly used workspace areas",
          evidenceReferences: recurringPatterns.map((p) => `usage:${p}`),
          confidenceScore: Math.min(0.9, 0.5 + recurringPatterns.length * 0.1),
          impactScore: 0.7,
          sourceEngine: "PILLOW-ITE-001",
        });
      }
    } catch {
      /* interaction tracking unavailable */
    }

    for (const prod of input.productivityRecords) {
      if (prod.productivityObservations.includes("workspace_usage")) {
        candidates.push({
          adaptationCategory: "adaptive_panel_organization",
          currentWorkflowContext: input.context.workflowContext,
          recommendedInterfaceAdaptations: [
            "Reorganize panels based on workspace usage pattern",
          ],
          recommendedNavigationAdaptations: [],
          recommendedWorkspaceAdaptations: [
            prod.navigationPatternSummary,
            "Group collaboration tools near active workspace",
          ],
          expectedProductivityBenefit: "Optimizes workspace for detected usage patterns",
          evidenceReferences: [...prod.evidenceReferences, `productivity:${prod.productivityId}`],
          confidenceScore: prod.confidenceScore,
          impactScore: 0.71,
          sourceEngine: "PILLOW-PIE-001",
          sourceProductivityIntelligenceId: prod.productivityId,
        });
      }

      if (prod.productivityObservations.includes("task_repetition")) {
        candidates.push({
          adaptationCategory: "adaptive_task_prioritization",
          currentWorkflowContext: input.context.workflowContext,
          recommendedInterfaceAdaptations: [
            "Elevate repeated task controls in interface",
          ],
          recommendedNavigationAdaptations: [
            "Add quick-access path for repeated task sequence",
          ],
          recommendedWorkspaceAdaptations: [
            "Dedicate workspace zone for high-frequency tasks",
          ],
          expectedProductivityBenefit: "Accelerates completion of recurring tasks",
          evidenceReferences: [...prod.evidenceReferences, `productivity:${prod.productivityId}`],
          confidenceScore: prod.confidenceScore,
          impactScore: 0.75,
          sourceEngine: "PILLOW-PIE-001",
          sourceProductivityIntelligenceId: prod.productivityId,
        });
      }
    }

    if (input.context.operationalContext.includes("executive") === false) {
      candidates.push({
        adaptationCategory: "adaptive_dashboard",
        currentWorkflowContext: input.context.workflowContext,
        recommendedInterfaceAdaptations: [
          "Personalize dashboard widgets for current operational context",
        ],
        recommendedNavigationAdaptations: [],
        recommendedWorkspaceAdaptations: [
          `Dashboard layout tuned to: ${input.context.operationalContext}`,
        ],
        expectedProductivityBenefit: "Surfaces context-relevant metrics and actions",
        evidenceReferences: input.context.evidenceReferences,
        confidenceScore: input.context.confidenceScore * 0.9,
        impactScore: 0.62,
        sourceEngine: "PILLOW-AIE-001",
      });
    }

    appendAdaptiveLog({
      event: "workspace_adaptation",
      level: "info",
      details: `Generated ${candidates.length} workspace adaptations`,
    });

    return { candidates, recurringPatterns };
  }
}
