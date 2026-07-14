/** T1-06 — Map interactions to T1-04 layout regions and T1-05 navigation graph. */

import type { LayoutModel } from "../layout-understanding-engine/types.js";
import type { NavigationGraph } from "../navigation-mapping-engine/types.js";

export class NavigationInteractionMapper {
  resolveLayoutRegion(
    layout: LayoutModel | null,
    componentId: string | null,
  ): string | null {
    if (!layout || !componentId) return null;
    return layout.componentToRegion[componentId] ?? null;
  }

  resolveNavigationNode(
    graph: NavigationGraph | null,
    componentId: string | null,
  ): string | null {
    if (!graph || !componentId) return null;
    const node = graph.nodes.find((n) => n.relatedComponentIds.includes(componentId));
    return node?.nodeId ?? null;
  }

  resolveNavigationEdge(
    graph: NavigationGraph | null,
    sourceNodeId: string | null,
    destNodeId: string | null,
  ): string | null {
    if (!graph || !sourceNodeId || !destNodeId) return null;
    const edge = graph.edges.find(
      (e) => e.sourceNodeId === sourceNodeId && e.destinationNodeId === destNodeId,
    );
    return edge?.edgeId ?? null;
  }

  inferNavigationEvents(
    previousGraph: NavigationGraph | null,
    currentGraph: NavigationGraph,
  ): {
    interactionType: "navigation_trigger" | "modal_open" | "modal_close" | "drawer_open" | "drawer_close" | "tab_switch" | "route_change_trigger";
    sourceNodeId: string | null;
    destNodeId: string | null;
    edgeId: string | null;
    confidence: number;
  }[] {
    const events: ReturnType<NavigationInteractionMapper["inferNavigationEvents"]> = [];
    const change = currentGraph.changeSummary;
    if (!change?.hasChanges) return events;

    for (const edge of currentGraph.edges) {
      if (edge.transitionType === "navigation" || edge.transitionType === "route_change") {
        events.push({
          interactionType: edge.transitionType === "route_change" ? "route_change_trigger" : "navigation_trigger",
          sourceNodeId: edge.sourceNodeId,
          destNodeId: edge.destinationNodeId,
          edgeId: edge.edgeId,
          confidence: edge.confidence,
        });
      }
      if (edge.transitionType === "modal_open") {
        events.push({
          interactionType: "modal_open",
          sourceNodeId: edge.sourceNodeId,
          destNodeId: edge.destinationNodeId,
          edgeId: edge.edgeId,
          confidence: edge.confidence,
        });
      }
      if (edge.transitionType === "modal_close") {
        events.push({
          interactionType: "modal_close",
          sourceNodeId: edge.sourceNodeId,
          destNodeId: edge.destinationNodeId,
          edgeId: edge.edgeId,
          confidence: edge.confidence,
        });
      }
      if (edge.transitionType === "drawer_open") {
        events.push({
          interactionType: "drawer_open",
          sourceNodeId: edge.sourceNodeId,
          destNodeId: edge.destinationNodeId,
          edgeId: edge.edgeId,
          confidence: edge.confidence,
        });
      }
      if (edge.transitionType === "drawer_close") {
        events.push({
          interactionType: "drawer_close",
          sourceNodeId: edge.sourceNodeId,
          destNodeId: edge.destinationNodeId,
          edgeId: edge.edgeId,
          confidence: edge.confidence,
        });
      }
      if (edge.transitionType === "tab_switch") {
        events.push({
          interactionType: "tab_switch",
          sourceNodeId: edge.sourceNodeId,
          destNodeId: edge.destinationNodeId,
          edgeId: edge.edgeId,
          confidence: edge.confidence,
        });
      }
    }

    void previousGraph;
    return events;
  }
}
