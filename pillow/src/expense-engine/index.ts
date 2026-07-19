/** PILLOW-EX-001 — Expense Engine exports (R3-05). */

export {
  ExpenseEngine,
  createExpenseEngine,
  resetExpenseEngineForTesting,
} from "./engine.js";

export {
  buildExpenseEngineConfiguration,
  DEFAULT_EXPENSE_ENGINE_CONFIGURATION,
  type ExpenseEngineConfiguration,
} from "./configuration.js";

export {
  EXPENSE_ENGINE_SYSTEM_PATH,
  EX_METADATA_VERSION,
  EXPENSE_ENGINE_ID,
  EX_CAPABILITIES,
  EXPENSE_CATEGORIES,
} from "./paths.js";

export type {
  ExpenseEngineVersion,
  ExpenseEngineRecord,
  ExpenseRecord,
  ExpenseAggregationSummary,
  ExpenseEngineRunReport,
  ExpenseEngineState,
  ExpenseCockpitSnapshot,
  ExpenseHealthReport,
  ExpensePerformanceStats,
  ConnectExpenseEngineInput,
  RecordExpenseEventInput,
  RecordSupplierPaymentInput,
  RecordShippingExpenseInput,
  RecordAdvertisingExpenseInput,
  RecordPlatformFeeInput,
  RecordOperationalExpenseInput,
  AggregateExpensesInput,
  ExpenseCategory,
  EngineStatus,
  HealthStatus,
  ValidationStatus,
} from "./types.js";
