import { buildScaleSimulationEngineConfiguration } from "@empireai/pillow";

import type {
  ScaleSimulationEngineState,
  SsiRunReport,
} from "@empireai/pillow";

function buildOfflineScaleSimulationEngineState(): ScaleSimulationEngineState {
  const configuration = buildScaleSimulationEngineConfiguration();
  return {
    engineVersion: "PILLOW-SSI-001",
    missionId: "X3-18",
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
      totalSimulationRecords: 0,
      highScoreCount: 0,
      averageSimulationScore: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      simulationRuns: 0,
      comparisonsPerformed: 0,
      rankingsPerformed: 0,
      recommendationsGenerated: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Scale Simulation Engine snapshot when Pillow session is unavailable. */
export function collectScaleSimulationEngineSnapshot() {
  const engine = buildOfflineScaleSimulationEngineState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "X3-18",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalSimulationRecords: 0,
      highScoreCount: 0,
      averageSimulationScore: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [] as string[],
    },
    latestReport: null as SsiRunReport | null,
    simulationRecords: [],
    recommendations: [],
  };
}
