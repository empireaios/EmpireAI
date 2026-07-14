/** T1-08 — Navigation history store. */

import type { NavigationGraph } from "../navigation-mapping-engine/types.js";

export class NavigationHistoryStore {
  extractSafe(graph: NavigationGraph) {
    return {
      graphId: graph.metadata.graphId,
      currentScreenId: graph.metadata.currentScreenId,
      currentRouteId: graph.metadata.currentRouteId,
      nodeCount: graph.nodes.length,
      edgeCount: graph.edges.length,
      nodes: graph.nodes.map((n) => ({
        nodeId: n.nodeId,
        label: n.label,
        kind: n.kind,
      })),
      changeSummary: graph.changeSummary,
    };
  }
}
