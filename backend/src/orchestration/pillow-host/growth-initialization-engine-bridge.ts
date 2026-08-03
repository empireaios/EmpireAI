import { buildGrowthInitializationEngineConfiguration } from "@empireai/pillow";
import type {
  GrowthInitializationEngineState,
  GrowthRunReport,
} from "@empireai/pillow";

function buildOfflineGrowthInitializationEngineState(): GrowthInitializationEngineState {
  const configuration = buildGrowthInitializationEngineConfiguration();
  return {
    engineVersion: "PILLOW-GIE-001",
    missionId: "X1-12",
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
      totalGrowthRecords: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      plansInitialized: 0,
      strategyRuns: 0,
      milestoneRuns: 0,
      acquisitionRuns: 0,
      recommendationRuns: 0,
      analyticsRuns: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Growth Initialization Engine snapshot when Pillow session is unavailable. */
export function collectGrowthInitializationEngineSnapshot() {
  const engine = buildOfflineGrowthInitializationEngineState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "X1-12",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalGrowthRecords: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [] as string[],
    },
  };
}

export type { GrowthRunReport };
