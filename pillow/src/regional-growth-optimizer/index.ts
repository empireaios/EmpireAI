/** PILLOW-RGO-001 — Regional Growth Optimizer exports (X4-14). */

export {
  RegionalGrowthOptimizerEngine,
  createRegionalGrowthOptimizerEngine,
  resetRegionalGrowthOptimizerForTesting,
  type RegionalGrowthOptimizerDependencies,
  type RegionalGrowthOptimizerOptions,
} from "./engine.js";

export {
  buildRegionalGrowthOptimizerConfiguration,
  DEFAULT_REGIONAL_GROWTH_OPTIMIZER_CONFIGURATION,
  type RegionalGrowthOptimizerConfiguration,
} from "./configuration.js";

export {
  REGIONAL_GROWTH_OPTIMIZER_SYSTEM_PATH,
  RGO_METADATA_VERSION,
  REGIONAL_GROWTH_OPTIMIZER_ID,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
  RGO_CAPABILITIES,
  OPTIMIZATION_CATEGORIES,
  OPTIMIZATION_STATUSES,
  PRIORITY_LEVELS,
} from "./paths.js";

export type {
  RegionalGrowthOptimizerVersion,
  EngineStatus,
  OperationalState,
  RgoCapability,
  ValidationStatus,
  HealthStatus,
  OptimizationCategory,
  OptimizationStatus,
  PriorityLevel,
  RegionalOptimizationRecord,
  RegionalGrowthOptimizerEngineRecord,
  RegionalGrowthRecommendation,
  RegionalValidationReport,
  RgoRunReport,
  RgoHealthReport,
  RgoPerformanceStats,
  RegionalGrowthOptimizerState,
  RgoCockpitSnapshot,
  ConnectRegionalGrowthOptimizerInput,
  RegionalOptimizationInput,
  RunRgoDiagnosticsInput,
} from "./types.js";
