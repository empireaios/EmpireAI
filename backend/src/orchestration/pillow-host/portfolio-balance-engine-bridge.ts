import { buildPortfolioBalanceEngineConfiguration } from "@empireai/pillow";
import type {
  PortfolioBalanceRunReport,
  PortfolioBalanceEngineState,
} from "@empireai/pillow";

function buildOfflinePortfolioBalanceEngineState(): PortfolioBalanceEngineState {
  const configuration = buildPortfolioBalanceEngineConfiguration();
  return {
    engineVersion: "PILLOW-PBE-001",
    missionId: "X2-08",
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
      totalBalanceRecords: 0,
      latestDiversificationScore: 0,
      imbalanceCount: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      diversificationAnalyses: 0,
      concentrationAnalyses: 0,
      exposureAnalyses: 0,
      optimizationRuns: 0,
      recommendationsGenerated: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Portfolio Balance Engine snapshot when Pillow session is unavailable. */
export function collectPortfolioBalanceEngineSnapshot() {
  const engine = buildOfflinePortfolioBalanceEngineState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "X2-08",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalBalanceRecords: 0,
      latestDiversificationScore: 0,
      imbalanceDetected: false,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [],
    },
    latestReport: null as PortfolioBalanceRunReport | null,
    balanceRecords: [],
  };
}
