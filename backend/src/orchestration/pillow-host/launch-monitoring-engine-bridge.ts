import { buildLaunchMonitoringEngineConfiguration } from "@empireai/pillow";
import type {
  LaunchMonitoringEngineState,
  LaunchMonitoringRunReport,
} from "@empireai/pillow";

function buildOfflineLaunchMonitoringEngineState(): LaunchMonitoringEngineState {
  const configuration = buildLaunchMonitoringEngineConfiguration();
  return {
    engineVersion: "PILLOW-LME-001",
    missionId: "X1-13",
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
      totalMonitoringRecords: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      monitoringRuns: 0,
      operationalRuns: 0,
      salesRuns: 0,
      customerRuns: 0,
      anomalyRuns: 0,
      recommendationRuns: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Launch Monitoring Engine snapshot when Pillow session is unavailable. */
export function collectLaunchMonitoringEngineSnapshot() {
  const engine = buildOfflineLaunchMonitoringEngineState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "X1-13",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalMonitoringRecords: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [] as string[],
    },
  };
}

export type { LaunchMonitoringRunReport };
