/** PILLOW-SIE-001 — SEO Intelligence Engine exports (R5-06). */

export {
  SeoIntelligenceEngine,
  createSeoIntelligenceEngine,
  resetSeoIntelligenceEngineForTesting,
} from "./engine.js";

export {
  buildSeoIntelligenceConfiguration,
  DEFAULT_SEO_INTELLIGENCE_CONFIGURATION,
  type SeoIntelligenceConfiguration,
} from "./configuration.js";

export {
  SEO_INTELLIGENCE_SYSTEM_PATH,
  SIE_METADATA_VERSION,
  SEO_INTELLIGENCE_ENGINE_ID,
  SIE_CAPABILITIES,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
} from "./paths.js";

export type {
  SeoIntelligenceEngineVersion,
  SeoEngineRecord,
  SeoRecord,
  SeoRunReport,
  SeoIntelligenceState,
  SeoCockpitSnapshot,
  SeoHealthReport,
  SeoPerformanceStats,
  ConnectSeoEngineInput,
  ManageSeoProjectInput,
  AnalyzePageInput,
  ManageKeywordInput,
  TrackRankingInput,
  DetectIssuesInput,
  OptimizeMetadataInput,
  RecommendInternalLinksInput,
  GenerateRecommendationsInput,
  MonitorOrganicPerformanceInput,
  SieCapability,
  EngineStatus,
  OperationalState,
  HealthStatus,
  ValidationStatus,
} from "./types.js";
