/** PILLOW-LOC-001 — Localization Engine exports (X4-03). */

export {
  LocalizationEngine,
  createLocalizationEngine,
  resetLocalizationEngineForTesting,
  type LocalizationEngineDependencies,
  type LocalizationEngineOptions,
} from "./engine.js";

export {
  buildLocalizationEngineConfiguration,
  DEFAULT_LOCALIZATION_ENGINE_CONFIGURATION,
  type LocalizationEngineConfiguration,
} from "./configuration.js";

export {
  LOCALIZATION_ENGINE_SYSTEM_PATH,
  LOC_METADATA_VERSION,
  LOCALIZATION_ENGINE_ID,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
  LOC_CAPABILITIES,
  LOCALIZATION_CATEGORIES,
} from "./paths.js";

export type {
  LocalizationEngineVersion,
  EngineStatus,
  OperationalState,
  LocCapability,
  ValidationStatus,
  HealthStatus,
  LocalizationCategory,
  LocalizationRecord,
  LocalizationEngineRecord,
  LocalizationRecommendation,
  LocalizationValidationReport,
  LocRunReport,
  LocHealthReport,
  LocPerformanceStats,
  LocalizationEngineState,
  LocCockpitSnapshot,
  ConnectLocalizationEngineInput,
  LocalizationInput,
  RunLocDiagnosticsInput,
} from "./types.js";
