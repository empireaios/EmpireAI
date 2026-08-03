/** PILLOW-SSE-001 — Supplier Scale Engine exports (X3-06). */

export {
  SupplierScaleEngine,
  createSupplierScaleEngine,
  resetSupplierScaleEngineForTesting,
  type SupplierScaleEngineDependencies,
  type SupplierScaleEngineOptions,
} from "./engine.js";

export {
  buildSupplierScaleEngineConfiguration,
  DEFAULT_SUPPLIER_SCALE_ENGINE_CONFIGURATION,
  type SupplierScaleEngineConfiguration,
} from "./configuration.js";

export {
  SUPPLIER_SCALE_ENGINE_SYSTEM_PATH,
  SSE_METADATA_VERSION,
  SUPPLIER_SCALE_ENGINE_ID,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
  SSE_CAPABILITIES,
} from "./paths.js";

export type {
  SupplierScaleEngineVersion,
  EngineStatus,
  OperationalState,
  SseCapability,
  ValidationStatus,
  HealthStatus,
  SupplierScalingRecord,
  SupplierScaleEngineRecord,
  SupplierRecommendation,
  SupplierValidationReport,
  SseRunReport,
  SseHealthReport,
  SsePerformanceStats,
  SupplierScaleEngineState,
  SseCockpitSnapshot,
  ConnectSupplierScaleEngineInput,
  SupplierScaleInput,
  RunSseDiagnosticsInput,
} from "./types.js";
