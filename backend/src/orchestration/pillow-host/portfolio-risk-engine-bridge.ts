import { buildPortfolioRiskEngineConfiguration } from "@empireai/pillow";
import type {
  PortfolioRiskRunReport,
  PortfolioRiskEngineState,
} from "@empireai/pillow";

function buildOfflinePortfolioRiskEngineState(): PortfolioRiskEngineState {
  const configuration = buildPortfolioRiskEngineConfiguration();
  return {
    engineVersion: "PILLOW-PRE-001",
    missionId: "X2-07",
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
      totalRiskRecords: 0,
      criticalRiskCount: 0,
      latestPortfolioRiskScore: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      monitoringRuns: 0,
      financialAnalyses: 0,
      operationalAnalyses: 0,
      scoringRuns: 0,
      emergingDetections: 0,
      recommendationsGenerated: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Portfolio Risk Engine snapshot when Pillow session is unavailable. */
export function collectPortfolioRiskEngineSnapshot() {
  const engine = buildOfflinePortfolioRiskEngineState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "X2-07",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalRiskRecords: 0,
      criticalRiskCount: 0,
      overallPortfolioRiskScore: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [],
    },
    latestReport: null as PortfolioRiskRunReport | null,
    riskRecords: [],
  };
}
