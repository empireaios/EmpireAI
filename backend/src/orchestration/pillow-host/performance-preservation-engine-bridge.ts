import { buildPerformancePreservationEngineConfiguration } from "@empireai/pillow";
import type {
  PerformancePreservationEngineState,
  PpeRunReport,
} from "@empireai/pillow";

function buildOfflinePerformancePreservationEngineState(): PerformancePreservationEngineState {
  const configuration = buildPerformancePreservationEngineConfiguration();
  return {
    engineVersion: "PILLOW-PPE-001",
    missionId: "X3-12",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    engineRecord: null,
    health: {
      status: "standby",
      healthScore: 50,
      engineEnabled: configuration.enabled,
      lastOperationAt: null,
      lastValidationDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      totalPreservationRecords: 0,
      degradationCount: 0,
      averageQualityScore: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      monitoringRuns: 0,
      degradationDetected: 0,
      qualityRegressionsDetected: 0,
      recommendationsGenerated: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Performance Preservation Engine snapshot when Pillow session is unavailable. */
export function collectPerformancePreservationEngineSnapshot() {
  const engine = buildOfflinePerformancePreservationEngineState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "X3-12",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalPreservationRecords: 0,
      degradationCount: 0,
      averageQualityScore: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [] as string[],
    },
    latestReport: null as PpeRunReport | null,
    preservationRecords: [],
    recommendations: [],
  };
}
