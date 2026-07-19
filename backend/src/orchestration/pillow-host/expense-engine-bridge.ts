import { buildExpenseEngineConfiguration } from "@empireai/pillow";
import type {
  ExpenseEngineRunReport,
  ExpenseEngineState,
} from "@empireai/pillow";

function buildOfflineExpenseEngineState(): ExpenseEngineState {
  const configuration = buildExpenseEngineConfiguration();
  return {
    engineVersion: "PILLOW-EX-001",
    missionId: "R3-05",
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
      totalExpenseRecords: 0,
      totalExpenses: 0,
      recurringExpenses: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      expenseEventsRecorded: 0,
      supplierPaymentsRecorded: 0,
      shippingExpensesRecorded: 0,
      advertisingExpensesRecorded: 0,
      platformFeesRecorded: 0,
      operationalExpensesRecorded: 0,
      aggregationsRun: 0,
      anomaliesDetected: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Expense Engine snapshot when Pillow session is unavailable. */
export function collectExpenseEngineSnapshot() {
  const engine = buildOfflineExpenseEngineState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R3-05",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalExpenseRecords: 0,
      totalExpenses: 0,
      recurringExpenses: 0,
      frameworkRegistered: false,
      recentLogs: [],
    },
    latestReport: null as ExpenseEngineRunReport | null,
    expenseRecords: [],
  };
}
