/** PILLOW-CPE-001 — Capacity Planning Engine exports (X3-04). */

export {
  CapacityPlanningEngine,
  createCapacityPlanningEngine,
  resetCapacityPlanningEngineForTesting,
  type CapacityPlanningEngineDependencies,
  type CapacityPlanningEngineOptions,
} from "./engine.js";

export {
  buildCapacityPlanningEngineConfiguration,
  DEFAULT_CAPACITY_PLANNING_ENGINE_CONFIGURATION,
  type CapacityPlanningEngineConfiguration,
} from "./configuration.js";

export {
  CAPACITY_PLANNING_ENGINE_SYSTEM_PATH,
  CPE_METADATA_VERSION,
  CAPACITY_PLANNING_ENGINE_ID,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
  CPE_CAPABILITIES,
  CAPACITY_DOMAINS,
} from "./paths.js";

export type {
  CapacityPlanningEngineVersion,
  EngineStatus,
  OperationalState,
  CpeCapability,
  ValidationStatus,
  HealthStatus,
  CapacityDomain,
  CapacityPlanningRecord,
  CapacityPlanningEngineRecord,
  CapacityRecommendation,
  CapacityValidationReport,
  CpeRunReport,
  CpeHealthReport,
  CpePerformanceStats,
  CapacityPlanningEngineState,
  CpeCockpitSnapshot,
  ConnectCapacityPlanningEngineInput,
  CapacityPlanningInput,
  RunCpeDiagnosticsInput,
} from "./types.js";
