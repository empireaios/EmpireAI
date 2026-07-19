/** PILLOW-BOE-001 — Budget Optimization Engine exports (R5-13). */

export {
  BudgetOptimizationEngine,
  createBudgetOptimizationEngine,
  resetBudgetOptimizationEngineForTesting,
  type BudgetOptimizationEngineDependencies,
} from "./engine.js";

export {
  buildBudgetOptimizationEngineConfiguration,
  DEFAULT_BUDGET_OPTIMIZATION_ENGINE_CONFIGURATION,
  type BudgetOptimizationEngineConfiguration,
} from "./configuration.js";

export {
  BUDGET_OPTIMIZATION_ENGINE_SYSTEM_PATH,
  BOE_METADATA_VERSION,
  BUDGET_OPTIMIZATION_ENGINE_ID,
  BOE_CAPABILITIES,
  MARKETING_CHANNELS,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
} from "./paths.js";

export type {
  BudgetOptimizationEngineVersion,
  BudgetEngineRecord,
  BudgetRecord,
  BudgetRunReport,
  BudgetOptimizationEngineState,
  BudgetCockpitSnapshot,
  BudgetHealthReport,
  BudgetPerformanceStats,
  ConnectBudgetOptimizationInput,
  AllocateBudgetInput,
  ReallocateBudgetInput,
  OptimizeBudgetsInput,
  MonitorSpendInput,
  RecommendAdjustmentsInput,
  BoeCapability,
  MarketingChannel,
  EngineStatus,
  OperationalState,
  HealthStatus,
  ValidationStatus,
} from "./types.js";
