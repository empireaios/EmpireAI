import { buildProductPortfolioBuilderConfiguration } from "@empireai/pillow";
import type {
  ProductPortfolioBuilderState,
  ProductPortfolioRunReport,
} from "@empireai/pillow";

function buildOfflineProductPortfolioBuilderState(): ProductPortfolioBuilderState {
  const configuration = buildProductPortfolioBuilderConfiguration();
  return {
    engineVersion: "PILLOW-PPB-001",
    missionId: "X1-08",
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
      totalPortfolioRecords: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      portfoliosBuilt: 0,
      discoveryRuns: 0,
      evaluationRuns: 0,
      optimizationRuns: 0,
      recommendationRuns: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Product Portfolio Builder snapshot when Pillow session is unavailable. */
export function collectProductPortfolioBuilderSnapshot() {
  const engine = buildOfflineProductPortfolioBuilderState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "X1-08",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalPortfolioRecords: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [] as string[],
    },
  };
}

export type { ProductPortfolioRunReport };
