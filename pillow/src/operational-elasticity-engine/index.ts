/** PILLOW-OEE-001 — Operational Elasticity Engine exports (X3-11). */

export {
  OperationalElasticityEngine,
  createOperationalElasticityEngine,
  resetOperationalElasticityEngineForTesting,
  type OperationalElasticityEngineDependencies,
  type OperationalElasticityEngineOptions,
} from "./engine.js";

export {
  buildOperationalElasticityEngineConfiguration,
  DEFAULT_OPERATIONAL_ELASTICITY_ENGINE_CONFIGURATION,
  type OperationalElasticityEngineConfiguration,
} from "./configuration.js";

export {
  OPERATIONAL_ELASTICITY_ENGINE_SYSTEM_PATH,
  OEE_METADATA_VERSION,
  OPERATIONAL_ELASTICITY_ENGINE_ID,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
  ELASTICITY_OPERATIONS,
  OEE_CAPABILITIES,
} from "./paths.js";

export type {
  OperationalElasticityEngineVersion,
  EngineStatus,
  OperationalState,
  ElasticityOperation,
  OeeCapability,
  ValidationStatus,
  HealthStatus,
  ElasticityRecord,
  OperationalElasticityEngineRecord,
  ElasticityRecommendation,
  ElasticityValidationReport,
  OeeRunReport,
  OeeHealthReport,
  OeePerformanceStats,
  OperationalElasticityEngineState,
  OeeCockpitSnapshot,
  ConnectOperationalElasticityEngineInput,
  OperationalElasticityInput,
  RunOeeDiagnosticsInput,
} from "./types.js";
