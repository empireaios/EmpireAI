/** PILLOW-MVE-001 — Market Validation Engine exports (X1-03). */

export {
  MarketValidationEngine,
  createMarketValidationEngine,
  resetMarketValidationEngineForTesting,
  type MarketValidationEngineDependencies,
} from "./engine.js";

export {
  buildMarketValidationEngineConfiguration,
  DEFAULT_MARKET_VALIDATION_ENGINE_CONFIGURATION,
  type MarketValidationEngineConfiguration,
} from "./configuration.js";

export {
  MARKET_VALIDATION_ENGINE_SYSTEM_PATH,
  MVE_METADATA_VERSION,
  MARKET_VALIDATION_ENGINE_ID,
  MVE_CAPABILITIES,
  INVESTMENT_RECOMMENDATIONS,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
} from "./paths.js";

export type {
  MarketValidationEngineVersion,
  MarketValidationEngineRecord,
  MarketValidationRecord,
  MarketValidationRunReport,
  MarketValidationEngineState,
  MarketValidationCockpitSnapshot,
  MarketValidationHealthReport,
  MarketValidationPerformanceStats,
  ConnectMarketValidationEngineInput,
  ValidateOpportunityInput,
  MarketValidationActionInput,
  MveCapability,
  InvestmentRecommendation,
  EngineStatus,
  OperationalState,
  HealthStatus,
  ValidationStatus,
} from "./types.js";
