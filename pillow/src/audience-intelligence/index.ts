/** PILLOW-AUD-001 — Audience Intelligence exports (R5-08). */

export {
  AudienceIntelligenceEngine,
  createAudienceIntelligenceEngine,
  resetAudienceIntelligenceForTesting,
  type AudienceIntelligenceDependencies,
} from "./engine.js";

export {
  buildAudienceIntelligenceConfiguration,
  DEFAULT_AUDIENCE_INTELLIGENCE_CONFIGURATION,
  type AudienceIntelligenceConfiguration,
} from "./configuration.js";

export {
  AUDIENCE_INTELLIGENCE_SYSTEM_PATH,
  AUD_METADATA_VERSION,
  AUDIENCE_INTELLIGENCE_ID,
  AUD_CAPABILITIES,
  AUDIENCE_SOURCES,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
} from "./paths.js";

export type {
  AudienceIntelligenceEngineVersion,
  AudienceEngineRecord,
  AudienceRecord,
  AudienceRunReport,
  AudienceIntelligenceState,
  AudienceCockpitSnapshot,
  AudienceHealthReport,
  AudiencePerformanceStats,
  ConnectAudienceIntelligenceInput,
  BuildAudienceInput,
  AnalyzeAudienceInput,
  DetectOverlapInput,
  GenerateAudienceRecommendationsInput,
  AudCapability,
  AudienceSource,
  EngineStatus,
  OperationalState,
  HealthStatus,
  ValidationStatus,
} from "./types.js";
