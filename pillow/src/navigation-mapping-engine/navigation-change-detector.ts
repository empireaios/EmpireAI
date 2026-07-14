/** T1-05 — Navigation graph change detection. */

import type { NavigationGraph } from "./types.js";
import type { RouteState } from "./route-state-detector.js";
import type { ScreenIdentity } from "./screen-identity-rules.js";
import type { LayoutModel } from "../layout-understanding-engine/types.js";

export function detectNavigationChanges(input: {
  previousGraph: NavigationGraph | null;
  currentGraph: NavigationGraph;
  identity: ScreenIdentity;
  routeState: RouteState;
  layout: LayoutModel;
  previousLayout: LayoutModel | null;
}): NavigationGraph["changeSummary"] {
  const prev = input.previousGraph;
  const curr = input.currentGraph;
  const prevNodeIds = new Set(prev?.nodes.map((n) => n.nodeId) ?? []);
  const currNodeIds = new Set(curr.nodes.map((n) => n.nodeId));
  const prevEdgeIds = new Set(prev?.edges.map((e) => e.edgeId) ?? []);
  const currEdgeIds = new Set(curr.edges.map((e) => e.edgeId));

  const nodesAdded = curr.nodes.filter((n) => !prevNodeIds.has(n.nodeId)).map((n) => n.nodeId);
  const nodesRemoved = prev?.nodes.filter((n) => !currNodeIds.has(n.nodeId)).map((n) => n.nodeId) ?? [];
  const edgesAdded = curr.edges.filter((e) => !prevEdgeIds.has(e.edgeId)).map((e) => e.edgeId);

  const modalOpened: string[] = [];
  const modalClosed: string[] = [];
  const drawerOpened: string[] = [];
  const drawerClosed: string[] = [];
  const tabsSwitched: string[] = [];

  if (input.identity.overlayKind === "modal" && input.routeState.screenChanged) {
    modalOpened.push(input.identity.screenId);
  }
  if (input.identity.overlayKind === "drawer" && input.routeState.screenChanged) {
    drawerOpened.push(input.identity.screenId);
  }

  const layoutChange = input.layout.changeSummary;
  if (layoutChange?.regionsDisappeared) {
    for (const id of layoutChange.regionsDisappeared) {
      if (id.includes("modal")) modalClosed.push(id);
      if (id.includes("drawer")) drawerClosed.push(id);
    }
  }

  for (const edge of curr.edges) {
    if (edge.transitionType === "tab_switch" && !prevEdgeIds.has(edge.edgeId)) {
      tabsSwitched.push(edge.edgeId);
    }
  }

  const hasChanges =
    input.routeState.screenChanged ||
    input.routeState.routeChanged ||
    input.routeState.viewChanged ||
    nodesAdded.length > 0 ||
    nodesRemoved.length > 0 ||
    edgesAdded.length > 0 ||
    modalOpened.length > 0 ||
    modalClosed.length > 0 ||
    drawerOpened.length > 0 ||
    drawerClosed.length > 0 ||
    tabsSwitched.length > 0;

  return {
    hasChanges,
    screenChanged: input.routeState.screenChanged,
    routeChanged: input.routeState.routeChanged,
    viewChanged: input.routeState.viewChanged,
    modalOpened,
    modalClosed,
    drawerOpened,
    drawerClosed,
    tabsSwitched,
    nodesAdded,
    nodesRemoved,
    edgesAdded,
    previousScreenId: prev?.metadata.currentScreenId ?? null,
    currentScreenId: input.identity.screenId,
  };
}
