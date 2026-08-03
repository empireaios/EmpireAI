/** PILLOW-CIE-001 — Country Intelligence Engine exports (X4-02). */

export {
  CountryIntelligenceEngine,
  createCountryIntelligenceEngine,
  resetCountryIntelligenceEngineForTesting,
  type CountryIntelligenceEngineDependencies,
  type CountryIntelligenceEngineOptions,
} from "./engine.js";

export {
  buildCountryIntelligenceEngineConfiguration,
  DEFAULT_COUNTRY_INTELLIGENCE_ENGINE_CONFIGURATION,
  type CountryIntelligenceEngineConfiguration,
} from "./configuration.js";

export {
  COUNTRY_INTELLIGENCE_ENGINE_SYSTEM_PATH,
  CIE_METADATA_VERSION,
  COUNTRY_INTELLIGENCE_ENGINE_ID,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
  CIE_CAPABILITIES,
  EXPANSION_PRIORITIES,
} from "./paths.js";

export type {
  CountryIntelligenceEngineVersion,
  EngineStatus,
  OperationalState,
  CieCapability,
  ValidationStatus,
  HealthStatus,
  ExpansionPriority,
  CountryIntelligenceRecord,
  CountryIntelligenceEngineRecord,
  CountryRecommendation,
  CountryValidationReport,
  CieRunReport,
  CieHealthReport,
  CiePerformanceStats,
  CountryIntelligenceEngineState,
  CieCockpitSnapshot,
  ConnectCountryIntelligenceEngineInput,
  CountryAnalysisInput,
  RunCieDiagnosticsInput,
} from "./types.js";
