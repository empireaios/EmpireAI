/** T1-07 — Active navigation context mapping. */

import type { NavigationGraph } from "../navigation-mapping-engine/types.js";

export type NavigationContext = {
  activeNodeId: string | null;
  workflowName: string | null;
  workflowStage: string | null;
  confidence: number;
};

export class ActiveNavigationContextMapper {
  map(graph: NavigationGraph | null): NavigationContext {
    if (!graph) {
      return { activeNodeId: null, workflowName: null, workflowStage: null, confidence: 0.5 };
    }

    const screenNode = graph.nodes.find(
      (n) => n.active && (n.kind === "screen" || n.kind === "view" || n.kind === "route"),
    );
    const routeNode = graph.nodes.find((n) => n.kind === "route" && n.active);

    return {
      activeNodeId: screenNode?.nodeId ?? graph.metadata.currentScreenId,
      workflowName: graph.metadata.currentScreenId ?? null,
      workflowStage: routeNode?.label ?? graph.metadata.currentRouteId,
      confidence: graph.metadata.confidenceScore,
    };
  }
}
