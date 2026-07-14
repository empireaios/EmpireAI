/** T1-09 — Rehydrate session context from visual memory and persisted snapshot. */

import { appendContinuityLog } from "./continuity-logging.js";
import type { VisualMemoryEngine } from "../visual-memory-engine/engine.js";
import type { SessionContextStore } from "./session-context-store.js";
import type { SessionContinuityModel } from "./types.js";

export class ContextRehydrationEngine {
  rehydrate(
    visualMemory: VisualMemoryEngine,
    store: SessionContextStore,
    current: SessionContinuityModel,
  ): SessionContinuityModel {
    const snapshot = store.getSnapshot();
    const persisted = snapshot?.lastContinuity;
    const recentMemory = visualMemory.retrieveRecent(5);
    const memoryIds = recentMemory.map((r) => r.memoryRecordId);

    const rehydrated: SessionContinuityModel = {
      ...current,
      recentMemoryRecordIds:
        memoryIds.length > 0 ? memoryIds : (persisted?.recentMemoryRecordIds ?? []),
      recentInteractionEventIds:
        current.recentInteractionEventIds.length > 0
          ? current.recentInteractionEventIds
          : (persisted?.recentInteractionEventIds ?? []),
      currentScreenId: current.currentScreenId ?? persisted?.currentScreenId ?? null,
      currentRouteOrViewId:
        current.currentRouteOrViewId ?? persisted?.currentRouteOrViewId ?? null,
      currentWorkflowContextId:
        current.currentWorkflowContextId ?? persisted?.currentWorkflowContextId ?? null,
      currentWorkflowStage:
        current.currentWorkflowStage ?? persisted?.currentWorkflowStage ?? null,
      currentNavigationNodeId:
        current.currentNavigationNodeId ?? persisted?.currentNavigationNodeId ?? null,
      currentLayoutId: current.currentLayoutId ?? persisted?.currentLayoutId ?? null,
      currentUiStateId: current.currentUiStateId ?? persisted?.currentUiStateId ?? "unknown",
      activeComponentIds:
        current.activeComponentIds.length > 0
          ? current.activeComponentIds
          : (persisted?.activeComponentIds ?? []),
      activeLayoutRegionIds:
        current.activeLayoutRegionIds.length > 0
          ? current.activeLayoutRegionIds
          : (persisted?.activeLayoutRegionIds ?? []),
      activeModalDrawerTabPanelIds:
        current.activeModalDrawerTabPanelIds.length > 0
          ? current.activeModalDrawerTabPanelIds
          : (persisted?.activeModalDrawerTabPanelIds ?? []),
      lastKnownStableState:
        current.lastKnownStableState ?? persisted?.lastKnownStableState ?? null,
      recoveryStatus: persisted ? "completed" : "partial",
      continuityConfidence: Math.min(
        1,
        Math.round((current.continuityConfidence + (persisted ? 0.15 : 0)) * 100) / 100,
      ),
    };

    appendContinuityLog({
      event: "context_rehydration",
      level: "info",
      details: `Rehydrated session ${rehydrated.sessionId} · recovery ${rehydrated.recoveryStatus}`,
    });

    return rehydrated;
  }
}
