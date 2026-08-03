/** PILLOW-BMG-001 — Business Model Generator exports (X1-04). */

export {
  BusinessModelGenerator,
  createBusinessModelGenerator,
  resetBusinessModelGeneratorForTesting,
  type BusinessModelGeneratorDependencies,
} from "./engine.js";

export {
  buildBusinessModelGeneratorConfiguration,
  DEFAULT_BUSINESS_MODEL_GENERATOR_CONFIGURATION,
  type BusinessModelGeneratorConfiguration,
} from "./configuration.js";

export {
  BUSINESS_MODEL_GENERATOR_SYSTEM_PATH,
  BMG_METADATA_VERSION,
  BUSINESS_MODEL_GENERATOR_ID,
  BMG_CAPABILITIES,
  REVENUE_MODELS,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
} from "./paths.js";

export type {
  BusinessModelGeneratorVersion,
  BusinessModelEngineRecord,
  BusinessModelRecord,
  BusinessModelRunReport,
  BusinessModelGeneratorState,
  BusinessModelCockpitSnapshot,
  BusinessModelHealthReport,
  BusinessModelPerformanceStats,
  ConnectBusinessModelGeneratorInput,
  GenerateBusinessModelInput,
  BusinessModelActionInput,
  BmgCapability,
  RevenueModelType,
  EngineStatus,
  OperationalState,
  HealthStatus,
  ValidationStatus,
} from "./types.js";
