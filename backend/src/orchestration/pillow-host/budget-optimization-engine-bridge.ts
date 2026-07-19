import { buildBudgetOptimizationEngineConfiguration } from "@empireai/pillow";
import type {
  BudgetOptimizationEngineState,
  BudgetOptimizationRunReport,
} from "@empireai/pillow";

function buildOfflineBudgetOptimizationEngineState(): BudgetOptimizationEngineState {
  const configuration = buildBudgetOptimizationEngineConfiguration();
  return {
    engineVersion: "PILLOW-BOE-001",
    missionId: "R5-13",
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
      totalBudgetRecords: 0,
      averageUtilization: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      allocationsRun: 0,
      reallocationsRun: 0,
      optimizationsRun: 0,
      recommendationsGenerated: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Budget Optimization Engine snapshot when Pillow session is unavailable. */
export function collectBudgetOptimizationEngineSnapshot() {
  const engine = buildOfflineBudgetOptimizationEngineState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R5-13",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalBudgetRecords: 0,
      averageUtilization: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [],
    },
    latestReport: null as BudgetOptimizationRunReport | null,
    budgetRecords: [],
  };
}
