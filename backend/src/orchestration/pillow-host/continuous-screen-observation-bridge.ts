import { buildContinuousScreenObservationConfiguration } from "@empireai/pillow";
import type {
  ContinuousObservationRunReport,
  ContinuousScreenObservationState,
} from "@empireai/pillow";

function buildOfflineContinuousScreenObservationState(): ContinuousScreenObservationState {
  const configuration = buildContinuousScreenObservationConfiguration();
  return {
    engineVersion: "PILLOW-CSO-001",
    missionId: "T5-01",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    activeSession: null,
    latestObservation: null,
    health: {
      status: "standby",
      healthScore: 50,
      observationEnabled: configuration.enabled,
      continuousMonitoringActive: false,
      lastObservationAt: null,
      lastValidationDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      activeSessions: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalObservations: 0,
      successfulObservations: 0,
      failedObservations: 0,
      screenChangesDetected: 0,
      routeChangesDetected: 0,
      layoutChangesDetected: 0,
      componentChangesDetected: 0,
      stateChangesDetected: 0,
      averageObservationDurationMs: 0,
      peakObservationDurationMs: 0,
      skippedCycles: 0,
    },
  };
}

/** Fallback Continuous Screen Observation snapshot when Pillow session is unavailable. */
export function collectContinuousScreenObservationSnapshot() {
  const engine = buildOfflineContinuousScreenObservationState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "T5-01",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      lastDecision: null,
      continuousMonitoringActive: false,
      totalObservations: 0,
      screenChangesDetected: 0,
      routeChangesDetected: 0,
      layoutChangesDetected: 0,
      componentChangesDetected: 0,
      confidenceScore: 0,
      recentLogs: [],
    },
    latestReport: null as ContinuousObservationRunReport | null,
    activeSession: null,
    latestObservation: null,
  };
}
