/**
 * G2-07 — Analytics metric lifecycle (framework state machine — no live analytics).
 */

import {
  ANALYTICS_METRIC_LIFECYCLE,
  type AnalyticsLifecycleTransitionRequest,
  type AnalyticsLifecycleTransitionResult,
  type AnalyticsMetricLifecyclePhase,
} from "../contracts/analytics-integration-types.js";

const ALLOWED_TRANSITIONS: Record<AnalyticsMetricLifecyclePhase, AnalyticsMetricLifecyclePhase[]> = {
  capture: ["validate", "archive"],
  validate: ["normalise", "capture", "archive"],
  normalise: ["aggregate", "validate", "archive"],
  aggregate: ["store", "normalise", "archive"],
  store: ["publish", "aggregate", "archive"],
  publish: ["archive", "store"],
  archive: [],
};

export function canTransitionAnalyticsLifecycle(
  currentPhase: AnalyticsMetricLifecyclePhase,
  targetPhase: AnalyticsMetricLifecyclePhase,
): boolean {
  return ALLOWED_TRANSITIONS[currentPhase]?.includes(targetPhase) ?? false;
}

export function transitionAnalyticsLifecycle(
  currentPhase: AnalyticsMetricLifecyclePhase,
  request: AnalyticsLifecycleTransitionRequest,
): AnalyticsLifecycleTransitionResult {
  if (!request.pillowGovernance) {
    return {
      analyticsId: request.analyticsId,
      previousPhase: currentPhase,
      currentPhase,
      allowed: false,
      reason: "Pillow governance required for analytics lifecycle transitions",
    };
  }

  if (!request.actorId?.trim() || !request.workspaceId?.trim()) {
    return {
      analyticsId: request.analyticsId,
      previousPhase: currentPhase,
      currentPhase,
      allowed: false,
      reason: "actorId and workspaceId are required for analytics lifecycle transitions",
    };
  }

  if (!canTransitionAnalyticsLifecycle(currentPhase, request.targetPhase)) {
    return {
      analyticsId: request.analyticsId,
      previousPhase: currentPhase,
      currentPhase,
      allowed: false,
      reason: `Lifecycle transition ${currentPhase} → ${request.targetPhase} is not permitted`,
    };
  }

  return {
    analyticsId: request.analyticsId,
    previousPhase: currentPhase,
    currentPhase: request.targetPhase,
    allowed: true,
    reason: `Lifecycle transition ${currentPhase} → ${request.targetPhase} approved by framework`,
  };
}

export function listAnalyticsMetricLifecyclePhases(): readonly AnalyticsMetricLifecyclePhase[] {
  return ANALYTICS_METRIC_LIFECYCLE;
}
