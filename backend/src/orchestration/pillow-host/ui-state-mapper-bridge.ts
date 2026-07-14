import { buildUiStateMapperConfiguration } from "@empireai/pillow";
import type { UiStateMapperState, UiStateModel } from "@empireai/pillow";

function buildOfflineUiStateMapperState(): UiStateMapperState {
  const configuration = buildUiStateMapperConfiguration();
  return {
    engineVersion: "PILLOW-USM-001",
    missionId: "T1-02",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    activeSession: null,
    latestState: null,
    previousState: null,
    health: {
      status: "standby",
      healthScore: 50,
      mappingEnabled: configuration.enabled,
      isMapping: false,
      lastSuccessfulMappingAt: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      averageProcessingDurationMs: 0,
      statesPerMinute: 0,
      backlogSize: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalStates: 0,
      successfulStates: 0,
      failedStates: 0,
      averageProcessingDurationMs: 0,
      peakProcessingDurationMs: 0,
      skippedFrames: 0,
      uptimeMs: 0,
    },
  };
}

/** Fallback UI State Mapper snapshot when Pillow session is unavailable. */
export function collectUiStateMapperSnapshot() {
  const engine = buildOfflineUiStateMapperState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "T1-02",
    live: false,
    engine,
    cockpit: {
      mappingStatus: engine.status,
      healthStatus: engine.health.status,
      statesGenerated: 0,
      latestStateTimestamp: null,
      viewportDimensions: "unknown",
      regionCount: 0,
      changeDetected: false,
      serializationFormat: engine.configuration.serializationFormat,
      recoveryAttempts: 0,
      recentLogs: [],
    },
    latestState: null as UiStateModel | null,
  };
}
