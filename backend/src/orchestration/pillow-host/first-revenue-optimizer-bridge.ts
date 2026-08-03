import { buildFirstRevenueOptimizerConfiguration } from "@empireai/pillow";
import type {
  FirstRevenueOptimizerState,
  FirstRevenueRunReport,
} from "@empireai/pillow";

function buildOfflineFirstRevenueOptimizerState(): FirstRevenueOptimizerState {
  const configuration = buildFirstRevenueOptimizerConfiguration();
  return {
    engineVersion: "PILLOW-FRO-001",
    missionId: "X1-14",
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
      totalRevenueRecords: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      optimizationsRun: 0,
      analysisRuns: 0,
      productRuns: 0,
      recommendationRuns: 0,
      bottleneckRuns: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback First Revenue Optimizer snapshot when Pillow session is unavailable. */
export function collectFirstRevenueOptimizerSnapshot() {
  const engine = buildOfflineFirstRevenueOptimizerState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "X1-14",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalRevenueRecords: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [] as string[],
    },
  };
}

export type { FirstRevenueRunReport };
