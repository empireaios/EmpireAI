/** PILLOW-MEE-001 — Marketing Experiment Engine exports (R5-17). */

export {
  MarketingExperimentEngine,
  createMarketingExperimentEngine,
  resetMarketingExperimentEngineForTesting,
  type MarketingExperimentEngineDependencies,
} from "./engine.js";

export {
  buildMarketingExperimentEngineConfiguration,
  DEFAULT_MARKETING_EXPERIMENT_ENGINE_CONFIGURATION,
  type MarketingExperimentEngineConfiguration,
} from "./configuration.js";

export {
  MARKETING_EXPERIMENT_ENGINE_SYSTEM_PATH,
  MEE_METADATA_VERSION,
  MARKETING_EXPERIMENT_ENGINE_ID,
  MEE_CAPABILITIES,
  EXPERIMENT_TYPES,
  EXPERIMENT_STATUSES,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
} from "./paths.js";

export type {
  MarketingExperimentEngineVersion,
  ExperimentEngineRecord,
  ExperimentRecord,
  ExperimentRunReport,
  MarketingExperimentEngineState,
  ExperimentCockpitSnapshot,
  ExperimentHealthReport,
  ExperimentPerformanceStats,
  ConnectMarketingExperimentEngineInput,
  CreateExperimentInput,
  ManageExperimentInput,
  AssignAudienceInput,
  AnalyzeExperimentInput,
  ArchiveExperimentInput,
  MeeCapability,
  ExperimentType,
  ExperimentStatus,
  EngineStatus,
  OperationalState,
  HealthStatus,
  ValidationStatus,
} from "./types.js";
