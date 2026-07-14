/** T1-05 — Transition mapping between screens. */

import type { LayoutModel } from "../layout-understanding-engine/types.js";
import type { ScreenIdentity } from "./screen-identity-rules.js";
import type { RouteState } from "./route-state-detector.js";
import type { NavigationEdge, TransitionType } from "./types.js";

export type TransitionCandidate = {
  sourceNodeId: string;
  destinationNodeId: string;
  triggerComponentId: string | null;
  transitionType: TransitionType;
  direction: NavigationEdge["direction"];
  confidence: number;
};

export class TransitionMapper {
  map(
    layout: LayoutModel,
    identity: ScreenIdentity,
    routeState: RouteState,
    previousScreenNodeId: string | null,
    currentScreenNodeId: string,
  ): TransitionCandidate[] {
    const transitions: TransitionCandidate[] = [];
    const now = layout.metadata.timestamp;

    if (!previousScreenNodeId || previousScreenNodeId === currentScreenNodeId) {
      return transitions;
    }

    let transitionType: TransitionType = "navigation";
    let direction: NavigationEdge["direction"] = "forward";

    if (routeState.routeChanged) transitionType = "route_change";
    if (routeState.viewChanged) transitionType = "view_change";

    if (identity.overlayKind === "modal") {
      transitionType = "modal_open";
      direction = "overlay";
    } else if (identity.overlayKind === "drawer") {
      transitionType = "drawer_open";
      direction = "overlay";
    }

    const layoutChange = layout.changeSummary;
    if (layoutChange?.regionsDisappeared.some((id) => id.includes("modal"))) {
      transitions.push({
        sourceNodeId: currentScreenNodeId,
        destinationNodeId: previousScreenNodeId,
        triggerComponentId: null,
        transitionType: "modal_close",
        direction: "backward",
        confidence: 0.8,
      });
    }
    if (layoutChange?.regionsDisappeared.some((id) => id.includes("drawer"))) {
      transitions.push({
        sourceNodeId: currentScreenNodeId,
        destinationNodeId: previousScreenNodeId,
        triggerComponentId: null,
        transitionType: "drawer_close",
        direction: "backward",
        confidence: 0.8,
      });
    }

    transitions.push({
      sourceNodeId: previousScreenNodeId,
      destinationNodeId: currentScreenNodeId,
      triggerComponentId: null,
      transitionType,
      direction,
      confidence: identity.confidence,
    });

    void now;
    return transitions;
  }

  detectTabSwitch(layout: LayoutModel, previousLayout: LayoutModel | null): TransitionCandidate[] {
    if (!previousLayout) return [];
    const prevTabs = previousLayout.regions.filter((r) => r.regionType === "toolbar");
    const currTabs = layout.regions.filter((r) => r.regionType === "toolbar");
    if (prevTabs.length === 0 && currTabs.length === 0) return [];

    const prevIds = new Set(prevTabs.flatMap((r) => r.componentIds));
    const currIds = new Set(currTabs.flatMap((r) => r.componentIds));
    const switched = [...currIds].filter((id) => !prevIds.has(id));
    if (switched.length === 0) return [];

    return [
      {
        sourceNodeId: `screen-${previousLayout.metadata.layoutId}`,
        destinationNodeId: `screen-${layout.metadata.layoutId}`,
        triggerComponentId: switched[0] ?? null,
        transitionType: "tab_switch",
        direction: "lateral",
        confidence: 0.75,
      },
    ];
  }
}
