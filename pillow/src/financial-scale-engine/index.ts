/** PILLOW-FSE-001 — Financial Scale Engine exports (X3-07). */

export {
  FinancialScaleEngine,
  createFinancialScaleEngine,
  resetFinancialScaleEngineForTesting,
  type FinancialScaleEngineDependencies,
  type FinancialScaleEngineOptions,
} from "./engine.js";

export {
  buildFinancialScaleEngineConfiguration,
  DEFAULT_FINANCIAL_SCALE_ENGINE_CONFIGURATION,
  type FinancialScaleEngineConfiguration,
} from "./configuration.js";

export {
  FINANCIAL_SCALE_ENGINE_SYSTEM_PATH,
  FSE_METADATA_VERSION,
  FINANCIAL_SCALE_ENGINE_ID,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
  FSE_CAPABILITIES,
} from "./paths.js";

export type {
  FinancialScaleEngineVersion,
  EngineStatus,
  OperationalState,
  FseCapability,
  ValidationStatus,
  HealthStatus,
  FinancialScalingRecord,
  FinancialScaleEngineRecord,
  FinancialRecommendation,
  FinancialValidationReport,
  FseRunReport,
  FseHealthReport,
  FsePerformanceStats,
  FinancialScaleEngineState,
  FseCockpitSnapshot,
  ConnectFinancialScaleEngineInput,
  FinancialScaleInput,
  RunFseDiagnosticsInput,
} from "./types.js";
