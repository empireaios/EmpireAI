/** PILLOW-PPE-001 — Performance Preservation Engine exports (X3-12). */

export {
  PerformancePreservationEngine,
  createPerformancePreservationEngine,
  resetPerformancePreservationEngineForTesting,
  type PerformancePreservationEngineDependencies,
  type PerformancePreservationEngineOptions,
} from "./engine.js";

export {
  buildPerformancePreservationEngineConfiguration,
  DEFAULT_PERFORMANCE_PRESERVATION_ENGINE_CONFIGURATION,
  type PerformancePreservationEngineConfiguration,
} from "./configuration.js";

export {
  PERFORMANCE_PRESERVATION_ENGINE_SYSTEM_PATH,
  PPE_METADATA_VERSION,
  PERFORMANCE_PRESERVATION_ENGINE_ID,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
  PRESERVATION_OPERATIONS,
  PPE_CAPABILITIES,
} from "./paths.js";

export type {
  PerformancePreservationEngineVersion,
  EngineStatus,
  OperationalState,
  PreservationOperation,
  PpeCapability,
  ValidationStatus,
  HealthStatus,
  PreservationRecord,
  PerformancePreservationEngineRecord,
  PreservationRecommendation,
  PreservationValidationReport,
  PpeRunReport,
  PpeHealthReport,
  PpePerformanceStats,
  PerformancePreservationEngineState,
  PpeCockpitSnapshot,
  ConnectPerformancePreservationEngineInput,
  PerformancePreservationInput,
  RunPpeDiagnosticsInput,
} from "./types.js";
