/** PILLOW-COC-001 — Customer Operations Certification exports (R4-19). */

export {
  CustomerOperationsCertificationEngine,
  createCustomerOperationsCertificationEngine,
  resetCustomerOperationsCertificationForTesting,
} from "./engine.js";

export {
  buildCustomerOperationsCertificationConfiguration,
  DEFAULT_CUSTOMER_OPERATIONS_CERTIFICATION_CONFIGURATION,
  type CustomerOperationsCertificationConfiguration,
} from "./configuration.js";

export {
  CUSTOMER_OPERATIONS_CERTIFICATION_SYSTEM_PATH,
  COC_METADATA_VERSION,
  CERTIFICATION_SCHEMA_VERSION,
  CUSTOMER_OPERATIONS_CERTIFIED_ID,
  CERTIFIED_PHASE,
  CERTIFIED_MISSIONS,
} from "./paths.js";

export type {
  CustomerOperationsCertificationEngineVersion,
  CustomerOperationsCertificationReport,
  CustomerOperationsCertificationState,
  CustomerOperationsCertificationCockpitSnapshot,
  CustomerOperationsCertificationHealthReport,
  CustomerOperationsCertificationPerformanceStats,
  MissionValidationResult,
  RunCustomerOperationsCertificationInput,
  CertificationStatus,
  EngineStatus,
  HealthStatus,
} from "./types.js";

export type { CustomerOperationsCertificationContext } from "./customer-operations-certification-context.js";
