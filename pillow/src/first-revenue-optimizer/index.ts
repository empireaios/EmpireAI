/** PILLOW-FRO-001 — First Revenue Optimizer exports (X1-14). */

export {
  FirstRevenueOptimizer,
  createFirstRevenueOptimizer,
  resetFirstRevenueOptimizerForTesting,
  type FirstRevenueOptimizerDependencies,
  type FirstRevenueOptimizerOptions,
} from "./engine.js";

export {
  buildFirstRevenueOptimizerConfiguration,
  DEFAULT_FIRST_REVENUE_OPTIMIZER_CONFIGURATION,
  type FirstRevenueOptimizerConfiguration,
} from "./configuration.js";

export {
  FIRST_REVENUE_OPTIMIZER_SYSTEM_PATH,
  FRO_METADATA_VERSION,
  FIRST_REVENUE_OPTIMIZER_ID,
  FRO_CAPABILITIES,
} from "./paths.js";

export { appendFroLog, getFroLogs, resetFroLogsForTesting } from "./fro-logging.js";

export type {
  FirstRevenueOptimizerState,
  RevenueOptimizationRecord,
  RevenueRunReport,
  RevenueOptimizerEngineRecord,
  RevenueCockpitSnapshot,
  RevenueHealthReport,
  RevenuePerformanceStats,
  ConnectFirstRevenueOptimizerInput,
  OptimizeFirstRevenueInput,
  RevenueActionInput,
} from "./types.js";
