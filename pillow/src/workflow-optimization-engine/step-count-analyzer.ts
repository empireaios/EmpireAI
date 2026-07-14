/** T2-05 — Step count analysis. */

import type { InteractionEvent } from "../interaction-tracking-engine/types.js";
import type { WorkflowContextModel } from "../context-awareness-engine/types.js";
import { WorkflowMetadataGenerator } from "./workflow-metadata-generator.js";
import type { WorkflowFrictionPoint } from "./types.js";
import type { WorkflowOptimizationConfiguration } from "./configuration.js";

export class StepCountAnalyzer {
  private readonly metadata = new WorkflowMetadataGenerator();

  analyze(
    events: InteractionEvent[],
    context: WorkflowContextModel | null,
    config: WorkflowOptimizationConfiguration,
  ): WorkflowFrictionPoint[] {
    const findings: WorkflowFrictionPoint[] = [];
    const navSteps = events.filter(
      (e) =>
        e.interactionType === "navigation_trigger" ||
        e.interactionType === "route_change_trigger" ||
        e.interactionType === "tab_switch",
    );

    if (navSteps.length >= config.stepThreshold) {
      findings.push({
        frictionId: this.metadata.buildFrictionId("too_many_steps"),
        category: "too_many_steps",
        description: `${navSteps.length} navigation steps detected (threshold ${config.stepThreshold})`,
        severity: navSteps.length >= config.stepThreshold + 2 ? "warning" : "info",
        affectedScreens: [...new Set(navSteps.map((e) => e.currentScreenId).filter(Boolean))] as string[],
        affectedComponents: [],
        affectedNavigationNodes: [
          ...new Set(
            navSteps
              .flatMap((e) => [e.sourceNavigationNodeId, e.destinationNavigationNodeId])
              .filter(Boolean),
          ),
        ] as string[],
        evidenceRef: context?.contextId ?? "interaction-events",
        confidence: 0.75,
      });
    }

    const totalActions = events.length;
    if (totalActions >= config.stepThreshold * 2) {
      findings.push({
        frictionId: this.metadata.buildFrictionId("too_many_steps"),
        category: "too_many_steps",
        description: `Workflow requires ${totalActions} interactions to complete current task`,
        severity: "warning",
        affectedScreens: context?.currentScreenId ? [context.currentScreenId] : [],
        affectedComponents: context?.activeComponentIds ?? [],
        affectedNavigationNodes: context?.activeNavigationNodeId
          ? [context.activeNavigationNodeId]
          : [],
        evidenceRef: context?.contextId ?? "workflow-context",
        confidence: 0.7,
      });
    }

    return findings;
  }
}
