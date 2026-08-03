/** PILLOW-AGO-001 — Autonomous Growth Optimizer exports (X3-15). */

export {
  AutonomousGrowthOptimizerEngine,
  createAutonomousGrowthOptimizerEngine,
  resetAutonomousGrowthOptimizerForTesting,
  type AutonomousGrowthOptimizerDependencies,
  type AutonomousGrowthOptimizerOptions,
} from "./engine.js";

export {
  buildAutonomousGrowthOptimizerConfiguration,
  DEFAULT_AUTONOMOUS_GROWTH_OPTIMIZER_CONFIGURATION,
  type AutonomousGrowthOptimizerConfiguration,
} from "./configuration.js";

export {
  AUTONOMOUS_GROWTH_OPTIMIZER_SYSTEM_PATH,
  AGO_METADATA_VERSION,
  AUTONOMOUS_GROWTH_OPTIMIZER_ID,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
  GROWTH_OPERATIONS,
  GROWTH_CATEGORIES,
  OPTIMIZATION_PRIORITIES,
  AGO_CAPABILITIES,
} from "./paths.js";

export type {
  AutonomousGrowthOptimizerVersion,
  EngineStatus,
  OperationalState,
  GrowthOperation,
  GrowthCategory,
  OptimizationPriority,
  AgoCapability,
  ValidationStatus,
  HealthStatus,
  GrowthOptimizationRecord,
  AutonomousGrowthOptimizerRecord,
  AutonomousGrowthRecommendation,
  GrowthValidationReport,
  AgoRunReport,
  AgoHealthReport,
  AgoPerformanceStats,
  AutonomousGrowthOptimizerState,
  AgoCockpitSnapshot,
  ConnectAutonomousGrowthOptimizerInput,
  GrowthOptimizationInput,
  RunAgoDiagnosticsInput,
} from "./types.js";
