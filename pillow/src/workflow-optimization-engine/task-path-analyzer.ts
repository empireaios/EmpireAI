/** T2-05 — Task path analysis. */

import type { InteractionEvent } from "../interaction-tracking-engine/types.js";
import type { NavigationGraph } from "../navigation-mapping-engine/types.js";
import type { WorkflowContextModel } from "../context-awareness-engine/types.js";
import { WorkflowMetadataGenerator } from "./workflow-metadata-generator.js";
import type { WorkflowFrictionPoint } from "./types.js";

export class TaskPathAnalyzer {
  private readonly metadata = new WorkflowMetadataGenerator();

  analyze(
    events: InteractionEvent[],
    navigation: NavigationGraph | null,
    context: WorkflowContextModel | null,
  ): WorkflowFrictionPoint[] {
    const findings: WorkflowFrictionPoint[] = [];
    if (!navigation || events.length < 2) return findings;

    const screens = events
      .map((e) => e.currentScreenId)
      .filter((s): s is string => !!s);
    const uniqueScreens = new Set(screens);

    if (uniqueScreens.size >= 4 && events.length < uniqueScreens.size * 2) {
      findings.push({
        frictionId: this.metadata.buildFrictionId("excessive_navigation"),
        category: "excessive_navigation",
        description: `Task path spans ${uniqueScreens.size} screens with only ${events.length} interactions`,
        severity: "warning",
        affectedScreens: [...uniqueScreens],
        affectedComponents: [],
        affectedNavigationNodes: navigation.nodes.map((n) => n.nodeId).slice(0, 5),
        evidenceRef: navigation.metadata.graphId,
        confidence: 0.65,
      });
    }

    const backtrack = this.detectBacktracking(events);
    if (backtrack) {
      findings.push({
        frictionId: this.metadata.buildFrictionId("backtracking"),
        category: "backtracking",
        description: "User backtracked to a previously visited screen during workflow",
        severity: "warning",
        affectedScreens: backtrack,
        affectedComponents: [],
        affectedNavigationNodes: [],
        evidenceRef: navigation.metadata.graphId,
        confidence: 0.7,
      });
    }

    if (context?.currentWorkflowStage && uniqueScreens.size > 3) {
      findings.push({
        frictionId: this.metadata.buildFrictionId("poor_confirmation_flow"),
        category: "poor_confirmation_flow",
        description: `Workflow stage '${context.currentWorkflowStage}' spans multiple screens before completion`,
        severity: "info",
        affectedScreens: [...uniqueScreens],
        affectedComponents: context.activeComponentIds,
        affectedNavigationNodes: context.activeNavigationNodeId
          ? [context.activeNavigationNodeId]
          : [],
        evidenceRef: context.contextId,
        confidence: 0.6,
      });
    }

    return findings;
  }

  private detectBacktracking(events: InteractionEvent[]): string[] | null {
    const visited: string[] = [];
    for (const event of events) {
      const screen = event.currentScreenId;
      if (!screen) continue;
      if (visited.includes(screen) && visited[visited.length - 1] !== screen) {
        return [screen, visited[visited.length - 1]!].filter(Boolean);
      }
      if (visited[visited.length - 1] !== screen) visited.push(screen);
    }
    return null;
  }
}
