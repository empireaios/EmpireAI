/** T1-05 — Cumulative navigation graph builder. */

import type { LayoutModel } from "../layout-understanding-engine/types.js";
import type { ScreenIdentity } from "./screen-identity-rules.js";
import type { NavigationEntry } from "./navigation-entry-rules.js";
import type { TransitionCandidate } from "./transition-mapper.js";
import type {
  NavigationEdge,
  NavigationGraph,
  NavigationNode,
  NavigationRelationship,
} from "./types.js";

export class NavigationGraphBuilder {
  private cumulativeNodes = new Map<string, NavigationNode>();
  private cumulativeEdges = new Map<string, NavigationEdge>();
  private cumulativeRelationships = new Map<string, NavigationRelationship>();

  buildSnapshot(input: {
    layout: LayoutModel;
    identity: ScreenIdentity;
    entries: NavigationEntry[];
    transitions: TransitionCandidate[];
    relationships: NavigationRelationship[];
    graphId: string;
    sessionId: string;
    merge: boolean;
  }): { nodes: NavigationNode[]; edges: NavigationEdge[]; relationships: NavigationRelationship[] } {
    const timestamp = input.layout.metadata.timestamp;
    const nodes: NavigationNode[] = [];

    const screenNodeId = `nav-node-screen-${input.identity.screenId}`;
    const screenNode: NavigationNode = {
      nodeId: screenNodeId,
      kind: input.identity.overlayKind === "none" ? "screen" : "view",
      identifier: input.identity.screenId,
      label: input.identity.screenId.split("::").pop() ?? input.identity.screenId,
      sourceLayoutId: input.layout.metadata.layoutId,
      relatedComponentIds: [],
      parentNodeId: null,
      childNodeIds: [],
      visibility: "visible",
      active: true,
      firstObservedAt: timestamp,
      lastObservedAt: timestamp,
      confidence: input.identity.confidence,
    };
    nodes.push(screenNode);

    if (input.identity.routeId) {
      const routeNodeId = `nav-node-route-${input.identity.routeId}`;
      nodes.push({
        nodeId: routeNodeId,
        kind: "route",
        identifier: input.identity.routeId,
        label: input.identity.routeId,
        sourceLayoutId: input.layout.metadata.layoutId,
        relatedComponentIds: [],
        parentNodeId: screenNodeId,
        childNodeIds: [],
        visibility: "visible",
        active: true,
        firstObservedAt: timestamp,
        lastObservedAt: timestamp,
        confidence: input.identity.confidence,
      });
      screenNode.childNodeIds.push(routeNodeId);
    }

    for (const entry of input.entries) {
      const nodeId = `nav-node-${entry.nodeKind}-${entry.entryId}`;
      nodes.push({
        nodeId,
        kind: entry.nodeKind,
        identifier: entry.entryId,
        label: entry.label,
        sourceLayoutId: input.layout.metadata.layoutId,
        relatedComponentIds: entry.componentIds,
        parentNodeId: screenNodeId,
        childNodeIds: [],
        visibility: "visible",
        active: entry.isEntryPoint,
        firstObservedAt: timestamp,
        lastObservedAt: timestamp,
        confidence: entry.confidence,
      });
      screenNode.childNodeIds.push(nodeId);
    }

    const edges: NavigationEdge[] = input.transitions.map((t, i) => ({
      edgeId: `nav-edge-${input.graphId}-${i}`,
      sourceNodeId: t.sourceNodeId,
      destinationNodeId: t.destinationNodeId,
      triggerComponentId: t.triggerComponentId,
      transitionType: t.transitionType,
      direction: t.direction,
      firstObservedAt: timestamp,
      lastObservedAt: timestamp,
      observationCount: 1,
      confidence: t.confidence,
    }));

    if (input.merge) {
      for (const node of nodes) {
        const existing = this.cumulativeNodes.get(node.nodeId);
        if (existing) {
          existing.lastObservedAt = node.lastObservedAt;
          existing.active = node.active;
          existing.relatedComponentIds = [
            ...new Set([...existing.relatedComponentIds, ...node.relatedComponentIds]),
          ];
          existing.childNodeIds = [...new Set([...existing.childNodeIds, ...node.childNodeIds])];
          existing.confidence = Math.max(existing.confidence, node.confidence);
        } else {
          this.cumulativeNodes.set(node.nodeId, { ...node });
        }
      }
      for (const edge of edges) {
        const key = `${edge.sourceNodeId}->${edge.destinationNodeId}:${edge.transitionType}`;
        const existing = this.cumulativeEdges.get(key);
        if (existing) {
          existing.lastObservedAt = edge.lastObservedAt;
          existing.observationCount += 1;
          existing.confidence = Math.max(existing.confidence, edge.confidence);
        } else {
          this.cumulativeEdges.set(key, { ...edge, edgeId: key });
        }
      }
      for (const rel of input.relationships) {
        this.cumulativeRelationships.set(rel.relationshipId, rel);
      }
      return {
        nodes: [...this.cumulativeNodes.values()],
        edges: [...this.cumulativeEdges.values()],
        relationships: [...this.cumulativeRelationships.values()],
      };
    }

    return { nodes, edges, relationships: input.relationships };
  }

  getCumulativeSnapshot(): {
    nodes: NavigationNode[];
    edges: NavigationEdge[];
    relationships: NavigationRelationship[];
  } {
    return {
      nodes: [...this.cumulativeNodes.values()],
      edges: [...this.cumulativeEdges.values()],
      relationships: [...this.cumulativeRelationships.values()],
    };
  }

  reset(): void {
    this.cumulativeNodes.clear();
    this.cumulativeEdges.clear();
    this.cumulativeRelationships.clear();
  }
}

export function buildEntryPoints(nodes: NavigationNode[]): string[] {
  return nodes.filter((n) => n.kind === "nav_item" && n.active).map((n) => n.nodeId);
}

export function buildDestinations(nodes: NavigationNode[]): string[] {
  return nodes
    .filter((n) => n.kind === "screen" || n.kind === "modal" || n.kind === "drawer" || n.kind === "view")
    .map((n) => n.nodeId);
}

export function emptyGraph(): NavigationGraph {
  const now = new Date().toISOString();
  return {
    metadata: {
      timestamp: now,
      sessionId: "",
      graphId: "",
      sourceLayoutId: "",
      currentScreenId: "",
      currentRouteId: null,
      currentViewId: null,
      version: "1.0.0",
      processingDurationMs: 0,
      mappingStatus: "idle",
      confidenceScore: 0,
    },
    nodes: [],
    edges: [],
    entryPoints: [],
    destinations: [],
    relationships: [],
    changeSummary: null,
  };
}
