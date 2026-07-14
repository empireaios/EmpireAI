/** T1-09 — Restore navigation position from graph and memory. */

import type { NavigationMappingEngine } from "../navigation-mapping-engine/engine.js";
import type { VisualMemoryEngine } from "../visual-memory-engine/engine.js";
import type { SessionContinuityModel } from "./types.js";

export class NavigationPositionRestorer {
  restore(
    navigationMapping: NavigationMappingEngine,
    visualMemory: VisualMemoryEngine,
    target: SessionContinuityModel | null,
  ): { navigationNodeId: string | null; routeOrViewId: string | null; confidence: number } {
    const graph = navigationMapping.getLatestGraph();
    if (graph) {
      const activeNode = graph.nodes.find((n) => n.active);
      return {
        navigationNodeId: activeNode?.nodeId ?? target?.currentNavigationNodeId ?? null,
        routeOrViewId: graph.metadata.currentRouteId ?? graph.metadata.currentViewId,
        confidence: graph.metadata.confidenceScore,
      };
    }

    if (target?.currentNavigationNodeId) {
      return {
        navigationNodeId: target.currentNavigationNodeId,
        routeOrViewId: target.currentRouteOrViewId,
        confidence: 0.6,
      };
    }

    const recent = visualMemory.retrieveRecent(1)[0];
    return {
      navigationNodeId: null,
      routeOrViewId: recent?.routeOrViewId ?? null,
      confidence: recent ? 0.5 : 0.3,
    };
  }
}
