import { buildLayoutUnderstandingConfiguration } from "@empireai/pillow";
import type { LayoutUnderstandingState, LayoutModel } from "@empireai/pillow";

function buildOfflineLayoutUnderstandingState(): LayoutUnderstandingState {
  const configuration = buildLayoutUnderstandingConfiguration();
  return {
    engineVersion: "PILLOW-LUE-001",
    missionId: "T1-04",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    activeSession: null,
    latestLayout: null,
    previousLayout: null,
    health: {
      status: "standby",
      healthScore: 50,
      layoutEnabled: configuration.enabled,
      isAnalyzing: false,
      lastSuccessfulLayoutAt: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      averageProcessingDurationMs: 0,
      layoutsPerMinute: 0,
      backlogSize: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalLayouts: 0,
      successfulLayouts: 0,
      failedLayouts: 0,
      totalRegionsDetected: 0,
      averageProcessingDurationMs: 0,
      peakProcessingDurationMs: 0,
      skippedRecognitions: 0,
      uptimeMs: 0,
    },
  };
}

/** Fallback Layout Understanding snapshot when Pillow session is unavailable. */
export function collectLayoutUnderstandingSnapshot() {
  const engine = buildOfflineLayoutUnderstandingState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "T1-04",
    live: false,
    engine,
    cockpit: {
      layoutStatus: engine.status,
      healthStatus: engine.health.status,
      layoutsGenerated: 0,
      regionsDetected: 0,
      latestLayoutTimestamp: null,
      regionTypeCounts: {},
      changeDetected: false,
      confidenceScore: 0,
      recoveryAttempts: 0,
      recentLogs: [],
    },
    latestLayout: null as LayoutModel | null,
  };
}
