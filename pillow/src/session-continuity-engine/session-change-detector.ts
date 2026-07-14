/** T1-09 — Detect session continuity changes and interruptions. */

import type { SessionContinuityConfiguration } from "./configuration.js";
import type { PersistedSessionSnapshot, SessionChangeSummary, SessionContinuityModel } from "./types.js";

export function detectSessionChanges(
  previous: SessionContinuityModel | null,
  current: SessionContinuityModel,
  persisted: PersistedSessionSnapshot | null,
  config: SessionContinuityConfiguration,
): SessionChangeSummary {
  const screenChanged = previous?.currentScreenId !== current.currentScreenId;
  const routeChanged = previous?.currentRouteOrViewId !== current.currentRouteOrViewId;
  const workflowChanged =
    previous?.currentWorkflowContextId !== current.currentWorkflowContextId;
  const navigationChanged =
    previous?.currentNavigationNodeId !== current.currentNavigationNodeId;
  const uiStateChanged = previous?.currentUiStateId !== current.currentUiStateId;

  let interruptionDetected = false;
  if (persisted?.restartDetected) interruptionDetected = true;
  if (persisted?.lastContinuity && persisted.lastPersistedAt) {
    const gap = Date.now() - new Date(persisted.lastPersistedAt).getTime();
    if (gap > config.sessionTimeoutMs) interruptionDetected = true;
  }
  if (
    persisted?.lastContinuity &&
    current.currentScreenId &&
    persisted.lastContinuity.currentScreenId &&
    current.currentScreenId !== persisted.lastContinuity.currentScreenId &&
    !previous
  ) {
    interruptionDetected = true;
  }

  const recoveryRequired =
    interruptionDetected && persisted?.lastContinuity != null;

  return {
    hasChanges:
      screenChanged ||
      routeChanged ||
      workflowChanged ||
      navigationChanged ||
      uiStateChanged ||
      interruptionDetected,
    screenChanged: screenChanged ?? false,
    routeChanged: routeChanged ?? false,
    workflowChanged: workflowChanged ?? false,
    navigationChanged: navigationChanged ?? false,
    uiStateChanged: uiStateChanged ?? false,
    interruptionDetected,
    recoveryRequired,
    previousScreenId: previous?.currentScreenId ?? persisted?.lastContinuity?.currentScreenId ?? null,
    currentScreenId: current.currentScreenId,
  };
}
