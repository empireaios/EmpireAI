import { buildPortfolioPerformanceEngineConfiguration } from "@empireai/pillow";
import type {
  PortfolioPerformanceRunReport,
  PortfolioPerformanceEngineState,
} from "@empireai/pillow";

function buildOfflinePortfolioPerformanceEngineState(): PortfolioPerformanceEngineState {
  const configuration = buildPortfolioPerformanceEngineConfiguration();
  return {
    engineVersion: "PILLOW-PPE-001",
    missionId: "X2-03",
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
      totalPerformanceRecords: 0,
      averagePerformanceScore: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      companiesMeasured: 0,
      comparisonsRun: 0,
      kpiCalculations: 0,
      analyticsRuns: 0,
      recommendationsGenerated: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Portfolio Performance Engine snapshot when Pillow session is unavailable. */
export function collectPortfolioPerformanceEngineSnapshot() {
  const engine = buildOfflinePortfolioPerformanceEngineState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "X2-03",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalPerformanceRecords: 0,
      averagePerformanceScore: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [],
    },
    latestReport: null as PortfolioPerformanceRunReport | null,
    performanceRecords: [],
  };
}
