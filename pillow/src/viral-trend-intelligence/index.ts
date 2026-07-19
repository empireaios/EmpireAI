/** PILLOW-VTI-001 — Viral Trend Intelligence exports (R5-16). */

export {
  ViralTrendIntelligence,
  createViralTrendIntelligence,
  resetViralTrendIntelligenceForTesting,
  type ViralTrendIntelligenceDependencies,
} from "./engine.js";

export {
  buildViralTrendIntelligenceConfiguration,
  DEFAULT_VIRAL_TREND_INTELLIGENCE_CONFIGURATION,
  type ViralTrendIntelligenceConfiguration,
} from "./configuration.js";

export {
  VIRAL_TREND_INTELLIGENCE_SYSTEM_PATH,
  VTI_METADATA_VERSION,
  VIRAL_TREND_INTELLIGENCE_ID,
  VTI_CAPABILITIES,
  TREND_CATEGORIES,
  TREND_SOURCES,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
} from "./paths.js";

export type {
  ViralTrendIntelligenceVersion,
  TrendEngineRecord,
  TrendRecord,
  TrendRunReport,
  ViralTrendIntelligenceState,
  TrendCockpitSnapshot,
  TrendHealthReport,
  TrendPerformanceStats,
  ConnectViralTrendIntelligenceInput,
  DiscoverTrendsInput,
  MonitorTrendsInput,
  PredictTrendsInput,
  RecommendTrendsInput,
  VtiCapability,
  TrendCategory,
  TrendSource,
  EngineStatus,
  OperationalState,
  HealthStatus,
  ValidationStatus,
} from "./types.js";
