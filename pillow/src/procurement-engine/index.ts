/** PILLOW-PCE-001 — Procurement Engine exports (R2-09). */

export {
  ProcurementEngine,
  createProcurementEngine,
  resetProcurementEngineForTesting,
} from "./engine.js";

export {
  buildProcurementEngineConfiguration,
  DEFAULT_PROCUREMENT_ENGINE_CONFIGURATION,
  type ProcurementEngineConfiguration,
} from "./configuration.js";

export {
  PROCUREMENT_ENGINE_SYSTEM_PATH,
  PCE_METADATA_VERSION,
  SUPPORTED_SUPPLIER_IDENTIFIERS as PROCUREMENT_SUPPLIER_IDENTIFIERS,
  PROCUREMENT_STATUSES,
  APPROVAL_STATUSES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type {
  ProcurementEngineVersion,
  ProcurementRecord,
  PurchaseOrderRecord,
  ProcurementReport,
  ProcurementEngineState,
  ProcurementCockpitSnapshot,
  ProcurementHealthReport,
  ProcurementPerformanceStats,
  CreateProcurementRequestInput,
  ApproveProcurementInput,
  SupplierSelectionResult,
  ProcurementFailureFinding,
  ProcurementStatus,
  ApprovalStatus,
  EngineStatus,
  HealthStatus,
  ValidationStatus,
} from "./types.js";
