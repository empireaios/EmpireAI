/** PILLOW-RC-001 — Reconciliation Engine exports (R3-08). */

export {
  ReconciliationEngine,
  createReconciliationEngine,
  resetReconciliationEngineForTesting,
} from "./engine.js";

export {
  buildReconciliationEngineConfiguration,
  DEFAULT_RECONCILIATION_ENGINE_CONFIGURATION,
  type ReconciliationEngineConfiguration,
} from "./configuration.js";

export {
  RECONCILIATION_ENGINE_SYSTEM_PATH,
  RC_METADATA_VERSION,
  RECONCILIATION_ENGINE_ID,
  RC_CAPABILITIES,
  RECONCILIATION_STATUSES,
} from "./paths.js";

export type {
  ReconciliationEngineVersion,
  ReconciliationEngineRecord,
  ReconciliationRecord,
  ReconciliationReport,
  ReconciliationMismatch,
  ReconciliationRunReport,
  ReconciliationEngineState,
  ReconciliationCockpitSnapshot,
  ReconciliationHealthReport,
  ReconciliationPerformanceStats,
  ConnectReconciliationEngineInput,
  ReconcilePaymentsInput,
  ReconcileBankingInput,
  ReconcileRevenueInput,
  ReconcileExpensesInput,
  ReconcileCashFlowInput,
  ReconcileAllInput,
  ReconciliationStatus,
  EngineStatus,
  HealthStatus,
  ValidationStatus,
} from "./types.js";
