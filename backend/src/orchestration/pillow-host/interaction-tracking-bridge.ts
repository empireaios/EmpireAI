import { buildInteractionTrackingConfiguration } from "@empireai/pillow";
import type { InteractionTrackingState, InteractionEvent } from "@empireai/pillow";

function buildOfflineInteractionTrackingState(): InteractionTrackingState {
  const configuration = buildInteractionTrackingConfiguration();
  return {
    engineVersion: "PILLOW-ITE-001",
    missionId: "T1-06",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    activeSession: null,
    recentEvents: [],
    health: {
      status: "standby",
      healthScore: 50,
      trackingEnabled: configuration.enabled,
      isTracking: false,
      lastSuccessfulEventAt: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      averageProcessingDurationMs: 0,
      eventsPerMinute: 0,
      backlogSize: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalEvents: 0,
      successfulEvents: 0,
      failedEvents: 0,
      inferredEvents: 0,
      ingestedEvents: 0,
      maskedSensitiveEvents: 0,
      averageProcessingDurationMs: 0,
      peakProcessingDurationMs: 0,
      skippedPolls: 0,
      uptimeMs: 0,
    },
  };
}

/** Fallback Interaction Tracking snapshot when Pillow session is unavailable. */
export function collectInteractionTrackingSnapshot() {
  const engine = buildOfflineInteractionTrackingState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "T1-06",
    live: false,
    engine,
    cockpit: {
      trackingStatus: engine.status,
      healthStatus: engine.health.status,
      eventsRecorded: 0,
      inferredEvents: 0,
      ingestedEvents: 0,
      maskedEvents: 0,
      latestEventTimestamp: null,
      latestInteractionType: null,
      currentScreenId: null,
      recoveryAttempts: 0,
      recentLogs: [],
    },
    recentEvents: [] as InteractionEvent[],
  };
}
