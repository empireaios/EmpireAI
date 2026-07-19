import { buildFinancialForecastEngineConfiguration } from "@empireai/pillow";
import type {
  FinancialForecastRunReport,
  FinancialForecastEngineState,
} from "@empireai/pillow";

function buildOfflineFinancialForecastEngineState(): FinancialForecastEngineState {
  const configuration = buildFinancialForecastEngineConfiguration();
  return {
    engineVersion: "PILLOW-FCT-001",
    missionId: "R3-13",
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
      totalForecastRecords: 0,
      lastConfidenceScore: null,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      projectionsGenerated: 0,
      trendsAnalyzed: 0,
      deviationsDetected: 0,
      risksDetected: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Financial Forecast Engine snapshot when Pillow session is unavailable. */
export function collectFinancialForecastEngineSnapshot() {
  const engine = buildOfflineFinancialForecastEngineState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R3-13",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalForecastRecords: 0,
      lastConfidenceScore: null,
      frameworkRegistered: false,
      recentLogs: [],
    },
    latestReport: null as FinancialForecastRunReport | null,
    forecastRecords: [],
  };
}
