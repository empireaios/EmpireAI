import { buildPortfolioOptimizationEngineConfiguration } from "@empireai/pillow";
import type {
  PortfolioOptimizationEngineState,
  PortfolioOptimizationRunReport,
} from "@empireai/pillow";

function buildOfflinePortfolioOptimizationEngineState(): PortfolioOptimizationEngineState {
  const configuration = buildPortfolioOptimizationEngineConfiguration();
  return {
    engineVersion: "PILLOW-POE-001",
    missionId: "X2-16",
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
      totalOptimizationRecords: 0,
      highPriorityOpportunities: 0,
      averageExpectedBenefit: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      performanceOptimizations: 0,
      capitalOptimizations: 0,
      resourceOptimizations: 0,
      priorityOptimizations: 0,
      operationalOptimizations: 0,
      balanceOptimizations: 0,
      opportunitiesDetected: 0,
      rankingsRun: 0,
      recommendationsGenerated: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Portfolio Optimization Engine snapshot when Pillow session is unavailable. */
export function collectPortfolioOptimizationEngineSnapshot() {
  const engine = buildOfflinePortfolioOptimizationEngineState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "X2-16",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalOptimizationRecords: 0,
      highPriorityOpportunities: 0,
      averageExpectedBenefit: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [] as string[],
    },
    latestReport: null as PortfolioOptimizationRunReport | null,
    optimizationRecords: [],
  };
}
