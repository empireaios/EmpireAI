/** PILLOW-RM-001 — Return Management exports (R2-13). */

export {
  ReturnManagementEngine,
  createReturnManagementEngine,
  resetReturnManagementForTesting,
} from "./engine.js";

export {
  buildReturnManagementConfiguration,
  DEFAULT_RETURN_MANAGEMENT_CONFIGURATION,
  type ReturnManagementConfiguration,
} from "./configuration.js";

export {
  RETURN_MANAGEMENT_SYSTEM_PATH,
  RM_METADATA_VERSION,
  SUPPORTED_SUPPLIER_IDENTIFIERS,
  RETURN_REASONS,
  RETURN_AUTHORIZATION_STATUSES,
  RETURN_SHIPMENT_STATUSES,
  RETURN_COMPLETION_STATUSES,
} from "./paths.js";

export type {
  ReturnManagementVersion,
  ReturnRecord,
  ReturnReport,
  ReturnManagementState,
  ReturnCockpitSnapshot,
  ReturnHealthReport,
  ReturnPerformanceStats,
  CreateReturnRequestInput,
  ReceiveCustomerReturnRequestInput,
  TrackReturnLifecycleInput,
  ReturnReason,
  ReturnAuthorizationStatus,
  ReturnShipmentStatus,
  ReturnCompletionStatus,
  SupportedSupplierIdentifier,
} from "./types.js";
