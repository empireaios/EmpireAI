import { buildReconciliationEngineConfiguration } from "@empireai/pillow";
import type {
  ReconciliationRunReport,
  ReconciliationEngineState,
} from "@empireai/pillow";

function buildOfflineReconciliationEngineState(): ReconciliationEngineState {
  const configuration = buildReconciliationEngineConfiguration();
  return {
    engineVersion: "PILLOW-RC-001",
    missionId: "R3-08",
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
      totalReconciliationRecords: 0,
      aggregateDifferenceAmount: 0,
      lastReconciliationStatus: null,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      paymentReconciliations: 0,
      bankingReconciliations: 0,
      revenueReconciliations: 0,
      expenseReconciliations: 0,
      cashFlowReconciliations: 0,
      fullReconciliations: 0,
      mismatchesDetected: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Reconciliation Engine snapshot when Pillow session is unavailable. */
export function collectReconciliationEngineSnapshot() {
  const engine = buildOfflineReconciliationEngineState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R3-08",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalReconciliationRecords: 0,
      aggregateDifferenceAmount: 0,
      lastReconciliationStatus: null,
      frameworkRegistered: false,
      recentLogs: [],
    },
    latestReport: null as ReconciliationRunReport | null,
    reconciliationRecords: [],
  };
}
