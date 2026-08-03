/** PILLOW-WFI-001 — Workforce Intelligence exports (X3-08). */

export {
  WorkforceIntelligenceEngine,
  createWorkforceIntelligenceEngine,
  resetWorkforceIntelligenceForTesting,
  type WorkforceIntelligenceDependencies,
  type WorkforceIntelligenceOptions,
} from "./engine.js";

export {
  buildWorkforceIntelligenceConfiguration,
  DEFAULT_WORKFORCE_INTELLIGENCE_CONFIGURATION,
  type WorkforceIntelligenceConfiguration,
} from "./configuration.js";

export {
  WORKFORCE_INTELLIGENCE_SYSTEM_PATH,
  WFI_METADATA_VERSION,
  WORKFORCE_INTELLIGENCE_ID,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
  WFI_CAPABILITIES,
} from "./paths.js";

export type {
  WorkforceIntelligenceVersion,
  EngineStatus,
  OperationalState,
  WfiCapability,
  ValidationStatus,
  HealthStatus,
  WorkforceRecord,
  WorkforceIntelligenceEngineRecord,
  WorkforceRecommendation,
  WorkforceValidationReport,
  WfiRunReport,
  WfiHealthReport,
  WfiPerformanceStats,
  WorkforceIntelligenceState,
  WfiCockpitSnapshot,
  ConnectWorkforceIntelligenceInput,
  WorkforceIntelligenceInput,
  RunWfiDiagnosticsInput,
} from "./types.js";
