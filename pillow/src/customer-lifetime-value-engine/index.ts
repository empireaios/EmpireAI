export {
  CUSTOMER_LIFETIME_VALUE_ENGINE_SYSTEM_PATH,
  CUSTOMER_LIFETIME_VALUE_ENGINE_ID,
  CLVE_METADATA_VERSION,
  CLVE_CAPABILITIES,
  ENGINE_STATUSES,
  ENGINE_STATES,
  VALUE_TIERS,
  VALIDATION_STATUSES,
  HEALTH_STATUSES,
} from "./paths.js";

export {
  buildCustomerLifetimeValueEngineConfiguration,
  DEFAULT_CUSTOMER_LIFETIME_VALUE_ENGINE_CONFIGURATION,
  type CustomerLifetimeValueEngineConfiguration,
  type ClvCalculationRule,
  type PredictionRule,
  type RetentionRule,
} from "./configuration.js";

export {
  CustomerLifetimeValueEngine,
  createCustomerLifetimeValueEngine,
  resetCustomerLifetimeValueEngineForTesting,
  type CustomerLifetimeValueEngineOptions,
} from "./engine.js";

export type {
  CustomerLifetimeValueEngineVersion,
  CustomerLifetimeValueEngineState,
  ClvEngineRecord,
  ClvRecord,
  ClvInsight,
  ClvFailure,
  ClvValidationReport,
  ClvRunReport,
  ClvHealthReport,
  ClvPerformanceStats,
  ClvCockpitSnapshot,
  ConnectClvEngineInput,
  CalculateCustomerLifetimeValueInput,
  TrackCustomerRevenueInput,
  TrackCustomerProfitabilityInput,
  TrackCustomerRetentionInput,
  TrackPurchaseFrequencyInput,
  TrackAverageOrderValueInput,
  PredictFutureCustomerValueInput,
  IdentifyHighValueCustomersInput,
  IdentifyDecliningCustomerValueInput,
  DetectClvFailuresInput,
  EngineStatus,
  EngineState,
  ValueTier,
  HealthStatus,
} from "./types.js";

export { appendClveLog, getClveLogs, resetClveLogsForTesting } from "./clve-logging.js";
