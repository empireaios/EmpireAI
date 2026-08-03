/** PILLOW-RAE-001 — Revenue Acceleration Engine exports (X3-16). */

export {
  RevenueAccelerationEngine,
  createRevenueAccelerationEngine,
  resetRevenueAccelerationEngineForTesting,
  type RevenueAccelerationEngineDependencies,
  type RevenueAccelerationEngineOptions,
} from "./engine.js";

export {
  buildRevenueAccelerationEngineConfiguration,
  DEFAULT_REVENUE_ACCELERATION_ENGINE_CONFIGURATION,
  type RevenueAccelerationEngineConfiguration,
} from "./configuration.js";

export {
  REVENUE_ACCELERATION_ENGINE_SYSTEM_PATH,
  RAE_METADATA_VERSION,
  REVENUE_ACCELERATION_ENGINE_ID,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
  REVENUE_OPERATIONS,
  REVENUE_CATEGORIES,
  RAE_CAPABILITIES,
} from "./paths.js";

export type {
  RevenueAccelerationEngineVersion,
  EngineStatus,
  OperationalState,
  RevenueOperation,
  RevenueCategory,
  RaeCapability,
  ValidationStatus,
  HealthStatus,
  RevenueAccelerationRecord,
  RevenueAccelerationEngineRecord,
  RevenueAccelerationRecommendation,
  RevenueValidationReport,
  RaeRunReport,
  RaeHealthReport,
  RaePerformanceStats,
  RevenueAccelerationEngineState,
  RaeCockpitSnapshot,
  ConnectRevenueAccelerationEngineInput,
  RevenueAccelerationInput,
  RunRaeDiagnosticsInput,
} from "./types.js";
