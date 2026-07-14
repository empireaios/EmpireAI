import { buildComponentRecognitionConfiguration } from "@empireai/pillow";
import type { ComponentRecognitionState, ComponentRecognitionResult } from "@empireai/pillow";

function buildOfflineComponentRecognitionState(): ComponentRecognitionState {
  const configuration = buildComponentRecognitionConfiguration();
  return {
    engineVersion: "PILLOW-CRE-001",
    missionId: "T1-03",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    activeSession: null,
    latestResult: null,
    previousResult: null,
    health: {
      status: "standby",
      healthScore: 50,
      recognitionEnabled: configuration.enabled,
      isRecognizing: false,
      lastSuccessfulRecognitionAt: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      averageProcessingDurationMs: 0,
      recognitionsPerMinute: 0,
      backlogSize: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalRecognitions: 0,
      successfulRecognitions: 0,
      failedRecognitions: 0,
      totalComponentsDetected: 0,
      averageProcessingDurationMs: 0,
      peakProcessingDurationMs: 0,
      skippedStates: 0,
      uptimeMs: 0,
    },
  };
}

/** Fallback Component Recognition snapshot when Pillow session is unavailable. */
export function collectComponentRecognitionSnapshot() {
  const engine = buildOfflineComponentRecognitionState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "T1-03",
    live: false,
    engine,
    cockpit: {
      recognitionStatus: engine.status,
      healthStatus: engine.health.status,
      recognitionsCompleted: 0,
      componentsDetected: 0,
      latestRecognitionTimestamp: null,
      componentTypeCounts: {},
      changeDetected: false,
      confidenceThreshold: engine.configuration.confidenceThreshold,
      recoveryAttempts: 0,
      recentLogs: [],
    },
    latestResult: null as ComponentRecognitionResult | null,
  };
}
