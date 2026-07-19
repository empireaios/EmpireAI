/** PILLOW-BMG-001 — Budget Management Engine exports (R3-14). */

export {
  BudgetManagementEngine,
  createBudgetManagementEngine,
  resetBudgetManagementEngineForTesting,
} from "./engine.js";

export {
  buildBudgetManagementEngineConfiguration,
  DEFAULT_BUDGET_MANAGEMENT_ENGINE_CONFIGURATION,
  type BudgetManagementEngineConfiguration,
  type BudgetPeriodRule,
  type BudgetCategoryRule,
} from "./configuration.js";

export {
  BUDGET_MANAGEMENT_ENGINE_SYSTEM_PATH,
  BMG_METADATA_VERSION,
  BUDGET_MANAGEMENT_ENGINE_ID,
  BMG_CAPABILITIES,
  BUDGET_PERIODS,
  BUDGET_CATEGORIES,
} from "./paths.js";

export type {
  BudgetManagementEngineVersion,
  BudgetManagementEngineRecord,
  BudgetRecord,
  BudgetVariance,
  BudgetOverrun,
  BudgetRecommendation,
  BudgetManagementRunReport,
  BudgetManagementEngineState,
  BudgetCockpitSnapshot,
  BudgetHealthReport,
  BudgetPerformanceStats,
  ConnectBudgetManagementEngineInput,
  CreateBudgetInput,
  AllocateBudgetInput,
  TrackBudgetUtilizationInput,
  CompareActualVsBudgetInput,
  DetectBudgetOverrunsInput,
  DetectBudgetVariancesInput,
  GenerateBudgetRecommendationsInput,
  BudgetPeriod,
  BudgetCategory,
  BudgetStatus,
  EngineStatus,
  HealthStatus,
  ValidationStatus,
} from "./types.js";
