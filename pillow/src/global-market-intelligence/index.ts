/** PILLOW-GMI-001 — Global Market Intelligence exports (X4-09). */

export {
  GlobalMarketIntelligenceEngine,
  createGlobalMarketIntelligenceEngine,
  resetGlobalMarketIntelligenceForTesting,
  type GlobalMarketIntelligenceDependencies,
  type GlobalMarketIntelligenceOptions,
} from "./engine.js";

export {
  buildGlobalMarketIntelligenceConfiguration,
  DEFAULT_GLOBAL_MARKET_INTELLIGENCE_CONFIGURATION,
  type GlobalMarketIntelligenceConfiguration,
} from "./configuration.js";

export {
  GLOBAL_MARKET_INTELLIGENCE_SYSTEM_PATH,
  GMI_METADATA_VERSION,
  GLOBAL_MARKET_INTELLIGENCE_ID,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
  GMI_CAPABILITIES,
  MARKET_CATEGORIES,
  MARKET_SIGNALS,
  RISK_LEVELS,
} from "./paths.js";

export type {
  GlobalMarketIntelligenceVersion,
  EngineStatus,
  OperationalState,
  GmiCapability,
  ValidationStatus,
  HealthStatus,
  MarketCategory,
  MarketSignal,
  RiskLevel,
  MarketIntelligenceRecord,
  GlobalMarketIntelligenceEngineRecord,
  MarketRecommendation,
  MarketValidationReport,
  GmiRunReport,
  GmiHealthReport,
  GmiPerformanceStats,
  GlobalMarketIntelligenceState,
  GmiCockpitSnapshot,
  ConnectGlobalMarketIntelligenceInput,
  MarketAnalysisInput,
  RunGmiDiagnosticsInput,
} from "./types.js";
