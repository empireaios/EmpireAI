/** PILLOW-CIE-001 — Customer Identity Engine (R4-01). */

export {
  CUSTOMER_IDENTITY_ENGINE_SYSTEM_PATH,
  CIE_METADATA_VERSION,
  CUSTOMER_IDENTITY_ENGINE_ID,
  ENGINE_STATUSES,
  ENGINE_STATES,
  IDENTITY_STATUSES,
  IDENTIFIER_TYPES,
  CIE_CAPABILITIES,
  VALIDATION_STATUSES,
  HEALTH_STATUSES,
} from "./paths.js";

export {
  buildCustomerIdentityEngineConfiguration,
  loadCustomerIdentityEngineConfigFile,
  DEFAULT_CUSTOMER_IDENTITY_ENGINE_CONFIGURATION,
  type CustomerIdentityEngineConfiguration,
  type IdentityMatchingRule,
  type IdentityMergeRule,
} from "./configuration.js";

export type {
  CustomerIdentityEngineVersion,
  EngineStatus,
  EngineState,
  IdentityStatus,
  IdentifierType,
  CieCapability,
  ValidationStatus,
  HealthStatus,
  CustomerIdentifier,
  CustomerIdentityEngineRecord,
  CustomerIdentityRecord,
  DuplicateIdentityMatch,
  IdentityValidationReport,
  CustomerIdentityRunReport,
  CustomerIdentityHealthReport,
  CustomerIdentityPerformanceStats,
  CustomerIdentityCockpitSnapshot,
  CieLogEntry,
  ConnectCustomerIdentityEngineInput,
  CreateCustomerIdentityInput,
  LinkCustomerIdentityInput,
  DetectDuplicateIdentitiesInput,
  MergeCustomerIdentitiesInput,
  ResolveCustomerIdentityInput,
  CustomerIdentityEngineState,
} from "./types.js";

export {
  CustomerIdentityEngine,
  createCustomerIdentityEngine,
  resetCustomerIdentityEngineForTesting,
  type CustomerIdentityEngineOptions,
} from "./engine.js";

export { CustomerIdentityManager } from "./customer-identity-manager.js";
export { CustomerIdentityController } from "./customer-identity-controller.js";
export { CustomerProfileEngine } from "./customer-profile-engine.js";
export { IdentityResolutionEngine } from "./identity-resolution-engine.js";
export { IdentityMergeEngine } from "./identity-merge-engine.js";
export { CustomerValidationEngine } from "./customer-validation-engine.js";
export { CustomerMetadataGenerator } from "./customer-metadata-generator.js";
export { CustomerIdentityValidator } from "./customer-identity-validator.js";
export { HealthMonitor } from "./health-monitor.js";
export { RecoveryManager } from "./recovery-manager.js";
export { IdentityRegistry } from "./identity-registry.js";
export { appendCieLog, getCieLogs, resetCieLogsForTesting } from "./cie-logging.js";
