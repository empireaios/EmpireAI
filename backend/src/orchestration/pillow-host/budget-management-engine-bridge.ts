import { buildBudgetManagementEngineConfiguration } from "@empireai/pillow";
import type {
  BudgetManagementRunReport,
  BudgetManagementEngineState,
} from "@empireai/pillow";

function buildOfflineBudgetManagementEngineState(): BudgetManagementEngineState {
  const configuration = buildBudgetManagementEngineConfiguration();
  return {
    engineVersion: "PILLOW-BMG-001",
    missionId: "R3-14",
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
      lastUtilizationPercentage: null,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      budgetsCreated: 0,
      allocationsManaged: 0,
      utilizationsTracked: 0,
      variancesDetected: 0,
      overrunsDetected: 0,
      recommendationsGenerated: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Budget Management Engine snapshot when Pillow session is unavailable. */
export function collectBudgetManagementEngineSnapshot() {
  const engine = buildOfflineBudgetManagementEngineState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R3-14",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalBudgetRecords: 0,
      lastUtilizationPercentage: null,
      frameworkRegistered: false,
      recentLogs: [],
    },
    latestReport: null as BudgetManagementRunReport | null,
    budgetRecords: [],
  };
}
