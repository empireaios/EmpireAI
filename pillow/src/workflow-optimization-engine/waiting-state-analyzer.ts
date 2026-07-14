/** T2-05 — Waiting state analysis. */

import type { WorkflowContextModel } from "../context-awareness-engine/types.js";
import type { InteractionEvent } from "../interaction-tracking-engine/types.js";
import { WorkflowMetadataGenerator } from "./workflow-metadata-generator.js";
import type { WorkflowFrictionPoint } from "./types.js";

export class WaitingStateAnalyzer {
  private readonly metadata = new WorkflowMetadataGenerator();

  analyze(
    context: WorkflowContextModel | null,
    events: InteractionEvent[],
    enabled: boolean,
  ): WorkflowFrictionPoint[] {
    if (!enabled) return [];
    const findings: WorkflowFrictionPoint[] = [];

    if (context?.waitingOrLoading) {
      findings.push({
        frictionId: this.metadata.buildFrictionId("waiting_loading_friction"),
        category: "waiting_loading_friction",
        description: "Workflow context indicates active waiting or loading state",
        severity: "warning",
        affectedScreens: context.currentScreenId ? [context.currentScreenId] : [],
        affectedComponents: context.activeComponentIds,
        affectedNavigationNodes: context.activeNavigationNodeId
          ? [context.activeNavigationNodeId]
          : [],
        evidenceRef: context.contextId,
        confidence: context.confidence,
      });
    }

    if (context?.contextState === "error_handling") {
      findings.push({
        frictionId: this.metadata.buildFrictionId("error_recovery_friction"),
        category: "error_recovery_friction",
        description: "Workflow in error state — recovery path may be unclear",
        severity: "error",
        affectedScreens: context.currentScreenId ? [context.currentScreenId] : [],
        affectedComponents: context.activeComponentIds,
        affectedNavigationNodes: context.activeNavigationNodeId
          ? [context.activeNavigationNodeId]
          : [],
        evidenceRef: context.contextId,
        confidence: 0.8,
      });
    }

    const loadingIndicators = events.filter(
      (e) => e.sourceComponentId?.includes("loading") || e.interactionType === "modal_open",
    );
    if (loadingIndicators.length >= 2 && !context?.waitingOrLoading) {
      findings.push({
        frictionId: this.metadata.buildFrictionId("waiting_loading_friction"),
        category: "waiting_loading_friction",
        description: "Multiple loading/modal interactions suggest waiting friction",
        severity: "info",
        affectedScreens: [
          ...new Set(loadingIndicators.map((e) => e.currentScreenId).filter(Boolean)),
        ] as string[],
        affectedComponents: loadingIndicators
          .map((e) => e.sourceComponentId)
          .filter((c): c is string => !!c),
        affectedNavigationNodes: [],
        evidenceRef: "loading-events",
        confidence: 0.55,
      });
    }

    return findings;
  }
}
