/** PILLOW-LI-001 — Language Intelligence exports (X4-04). */

export {
  LanguageIntelligenceEngine,
  createLanguageIntelligenceEngine,
  resetLanguageIntelligenceForTesting,
  type LanguageIntelligenceDependencies,
  type LanguageIntelligenceEngineOptions,
} from "./engine.js";

export {
  buildLanguageIntelligenceConfiguration,
  DEFAULT_LANGUAGE_INTELLIGENCE_CONFIGURATION,
  type LanguageIntelligenceConfiguration,
} from "./configuration.js";

export {
  LANGUAGE_INTELLIGENCE_SYSTEM_PATH,
  LI_METADATA_VERSION,
  LANGUAGE_INTELLIGENCE_ID,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
  LI_CAPABILITIES,
  TRANSLATION_CATEGORIES,
  DEFAULT_SUPPORTED_LANGUAGES,
} from "./paths.js";

export type {
  LanguageIntelligenceVersion,
  EngineStatus,
  OperationalState,
  LiCapability,
  ValidationStatus,
  HealthStatus,
  TranslationCategory,
  SupportedLanguageStatus,
  LanguageIntelligenceRecord,
  LanguageIntelligenceEngineRecord,
  LanguageRecommendation,
  LanguageValidationReport,
  LiRunReport,
  LiHealthReport,
  LiPerformanceStats,
  LanguageIntelligenceEngineState,
  LiCockpitSnapshot,
  ConnectLanguageIntelligenceInput,
  LanguageAnalysisInput,
  RunLiDiagnosticsInput,
} from "./types.js";
