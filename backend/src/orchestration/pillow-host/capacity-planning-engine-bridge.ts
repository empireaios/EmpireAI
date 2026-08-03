import { buildCapacityPlanningEngineConfiguration } from "@empireai/pillow";
import type {
  CapacityPlanningEngineState,
  CpeRunReport,
} from "@empireai/pillow";

function buildOfflineCapacityPlanningEngineState(): CapacityPlanningEngineState {
  const configuration = buildCapacityPlanningEngineConfiguration();
  return {
    engineVersion: "PILLOW-CPE-001",
    missionId: "X3-04",
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
      totalPlanningRecords: 0,
      bottleneckCount: 0,
      averageUtilization: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      monitoringRuns: 0,
      forecastsRun: 0,
      bottlenecksDetected: 0,
      recommendationsGenerated: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Capacity Planning Engine snapshot when Pillow session is unavailable. */
export function collectCapacityPlanningEngineSnapshot() {
  const engine = buildOfflineCapacityPlanningEngineState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "X3-04",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalPlanningRecords: 0,
      bottleneckCount: 0,
      averageUtilization: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [] as string[],
    },
    latestReport: null as CpeRunReport | null,
    planningRecords: [],
    recommendations: [],
  };
}
