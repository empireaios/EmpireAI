/** PILLOW-CRM-001 — CRM Foundation (R4-02). */

export {
  CRM_FOUNDATION_SYSTEM_PATH,
  CRM_METADATA_VERSION,
  CRM_FOUNDATION_ID,
  ENGINE_STATUSES,
  ENGINE_STATES,
  LIFECYCLE_STATUSES,
  CRM_CAPABILITIES,
  VALIDATION_STATUSES,
  HEALTH_STATUSES,
} from "./paths.js";

export {
  buildCrmFoundationConfiguration,
  loadCrmFoundationConfigFile,
  DEFAULT_CRM_FOUNDATION_CONFIGURATION,
  type CrmFoundationConfiguration,
  type LifecycleRule,
  type TaggingRule,
  type SearchRule,
} from "./configuration.js";

export type {
  CrmFoundationVersion,
  EngineStatus,
  EngineState,
  LifecycleStatus,
  CrmCapability,
  ValidationStatus,
  HealthStatus,
  CustomerContactInfo,
  CustomerNote,
  CustomAttribute,
  CrmEngineRecord,
  CrmRecord,
  CrmValidationReport,
  CrmSearchResult,
  CrmRunReport,
  CrmHealthReport,
  CrmPerformanceStats,
  CrmCockpitSnapshot,
  CrmLogEntry,
  ConnectCrmFoundationInput,
  CreateCustomerProfileInput,
  UpdateCrmRecordInput,
  SearchCustomerRecordsInput,
  AddCustomerNoteInput,
  UpdateCustomerTagsInput,
  UpdateCustomAttributesInput,
  CrmFoundationState,
} from "./types.js";

export {
  CrmFoundationEngine,
  createCrmFoundationEngine,
  resetCrmFoundationForTesting,
  type CrmFoundationOptions,
} from "./engine.js";

export { CrmManager } from "./crm-manager.js";
export { CrmController } from "./crm-controller.js";
export { CustomerProfileManager } from "./customer-profile-manager.js";
export { CustomerRecordEngine } from "./customer-record-engine.js";
export { CustomerSearchEngine } from "./customer-search-engine.js";
export { CustomerAttributeManager } from "./customer-attribute-manager.js";
export { CrmValidationEngine } from "./crm-validation-engine.js";
export { CrmMetadataGenerator } from "./crm-metadata-generator.js";
export { CrmValidator } from "./crm-validator.js";
export { HealthMonitor } from "./health-monitor.js";
export { RecoveryManager } from "./recovery-manager.js";
export { CrmRegistry } from "./crm-registry.js";
export { appendCrmLog, getCrmLogs, resetCrmLogsForTesting } from "./crm-logging.js";
