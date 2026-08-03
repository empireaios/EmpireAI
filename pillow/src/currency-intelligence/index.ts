/** PILLOW-CUR-001 — Currency Intelligence exports (X4-05). */

export {
  CurrencyIntelligenceEngine,
  createCurrencyIntelligenceEngine,
  resetCurrencyIntelligenceForTesting,
  type CurrencyIntelligenceDependencies,
  type CurrencyIntelligenceEngineOptions,
} from "./engine.js";

export {
  buildCurrencyIntelligenceConfiguration,
  DEFAULT_CURRENCY_INTELLIGENCE_CONFIGURATION,
  type CurrencyIntelligenceConfiguration,
} from "./configuration.js";

export {
  CURRENCY_INTELLIGENCE_SYSTEM_PATH,
  CUR_METADATA_VERSION,
  CURRENCY_INTELLIGENCE_ID,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
  CUR_CAPABILITIES,
  DEFAULT_SUPPORTED_CURRENCIES,
} from "./paths.js";

export type {
  CurrencyIntelligenceVersion,
  EngineStatus,
  OperationalState,
  CurCapability,
  ValidationStatus,
  HealthStatus,
  RegionalPricingStatus,
  ExchangeRateSource,
  CurrencyIntelligenceRecord,
  CurrencyIntelligenceEngineRecord,
  CurrencyRecommendation,
  CurrencyValidationReport,
  CurRunReport,
  CurHealthReport,
  CurPerformanceStats,
  CurrencyIntelligenceEngineState,
  CurCockpitSnapshot,
  ConnectCurrencyIntelligenceInput,
  CurrencyAnalysisInput,
  RunCurDiagnosticsInput,
} from "./types.js";
