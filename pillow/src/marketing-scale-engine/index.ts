/** PILLOW-MSE-001 — Marketing Scale Engine exports (X3-05). */

export {
  MarketingScaleEngine,
  createMarketingScaleEngine,
  resetMarketingScaleEngineForTesting,
  type MarketingScaleEngineDependencies,
  type MarketingScaleEngineOptions,
} from "./engine.js";

export {
  buildMarketingScaleEngineConfiguration,
  DEFAULT_MARKETING_SCALE_ENGINE_CONFIGURATION,
  type MarketingScaleEngineConfiguration,
} from "./configuration.js";

export {
  MARKETING_SCALE_ENGINE_SYSTEM_PATH,
  MSE_METADATA_VERSION,
  MARKETING_SCALE_ENGINE_ID,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
  MSE_CAPABILITIES,
  MARKETING_CHANNELS,
} from "./paths.js";

export type {
  MarketingScaleEngineVersion,
  EngineStatus,
  OperationalState,
  MseCapability,
  ValidationStatus,
  HealthStatus,
  MarketingChannel,
  MarketingScalingRecord,
  MarketingScaleEngineRecord,
  MarketingRecommendation,
  MarketingValidationReport,
  MseRunReport,
  MseHealthReport,
  MsePerformanceStats,
  MarketingScaleEngineState,
  MseCockpitSnapshot,
  ConnectMarketingScaleEngineInput,
  MarketingScaleInput,
  RunMseDiagnosticsInput,
} from "./types.js";
