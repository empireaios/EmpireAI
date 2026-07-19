/** PILLOW-CVI-001 — Conversion Intelligence exports (R5-14). */

export {
  ConversionIntelligence,
  createConversionIntelligence,
  resetConversionIntelligenceForTesting,
  type ConversionIntelligenceDependencies,
} from "./engine.js";

export {
  buildConversionIntelligenceConfiguration,
  DEFAULT_CONVERSION_INTELLIGENCE_CONFIGURATION,
  type ConversionIntelligenceConfiguration,
} from "./configuration.js";

export {
  CONVERSION_INTELLIGENCE_SYSTEM_PATH,
  CVI_METADATA_VERSION,
  CONVERSION_INTELLIGENCE_ID,
  CVI_CAPABILITIES,
  MARKETING_CHANNELS,
  FUNNEL_STAGES,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
} from "./paths.js";

export type {
  ConversionIntelligenceVersion,
  ConversionEngineRecord,
  ConversionRecord,
  ConversionRunReport,
  ConversionIntelligenceState,
  ConversionCockpitSnapshot,
  ConversionHealthReport,
  ConversionPerformanceStats,
  ConnectConversionIntelligenceInput,
  TrackFunnelInput,
  MeasureConversionInput,
  OptimizeFunnelInput,
  RecommendImprovementsInput,
  CviCapability,
  MarketingChannel,
  FunnelStage,
  EngineStatus,
  OperationalState,
  HealthStatus,
  ValidationStatus,
} from "./types.js";
