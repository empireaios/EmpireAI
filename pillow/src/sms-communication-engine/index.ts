/** PILLOW-SCE-001 — SMS Communication Engine (R4-05). */

export {
  SMS_COMMUNICATION_ENGINE_SYSTEM_PATH,
  SCE_METADATA_VERSION,
  SMS_COMMUNICATION_ENGINE_ID,
  ENGINE_STATUSES,
  ENGINE_STATES,
  SMS_CATEGORIES,
  DELIVERY_STATUSES,
  SCE_CAPABILITIES,
  VALIDATION_STATUSES,
  HEALTH_STATUSES,
} from "./paths.js";

export {
  buildSmsCommunicationEngineConfiguration,
  loadSmsCommunicationEngineConfigFile,
  DEFAULT_SMS_COMMUNICATION_ENGINE_CONFIGURATION,
  type SmsCommunicationEngineConfiguration,
  type SmsDeliveryRule,
  type SmsTemplateRule,
  type SmsQueueRule,
} from "./configuration.js";

export type {
  SmsCommunicationEngineVersion,
  EngineStatus,
  EngineState,
  SmsCategory,
  DeliveryStatus,
  SceCapability,
  ValidationStatus,
  HealthStatus,
  SmsTemplate,
  SmsEngineRecord,
  SmsRecord,
  SmsFailure,
  SmsValidationReport,
  SmsRunReport,
  SmsHealthReport,
  SmsPerformanceStats,
  SmsCockpitSnapshot,
  SceLogEntry,
  ConnectSmsCommunicationEngineInput,
  SendSmsInput,
  CreateSmsTemplateInput,
  ProcessSmsQueueInput,
  TrackDeliveryConfirmationInput,
  RetrySmsInput,
  DetectSmsFailuresInput,
  SmsCommunicationEngineState,
} from "./types.js";

export {
  SmsCommunicationEngine,
  createSmsCommunicationEngine,
  resetSmsCommunicationEngineForTesting,
  type SmsCommunicationEngineOptions,
} from "./engine.js";

export { SmsCommunicationManager } from "./sms-communication-manager.js";
export { SmsCommunicationController } from "./sms-communication-controller.js";
export { SmsDeliveryEngine } from "./sms-delivery-engine.js";
export { SmsTemplateManager } from "./sms-template-manager.js";
export { SmsQueueManager } from "./sms-queue-manager.js";
export { SmsTrackingEngine } from "./sms-tracking-engine.js";
export { SmsAnalyticsEngine } from "./sms-analytics-engine.js";
export { SmsValidationEngine } from "./sms-validation-engine.js";
export { SmsMetadataGenerator } from "./sms-metadata-generator.js";
export { SmsValidator } from "./sms-validator.js";
export { HealthMonitor } from "./health-monitor.js";
export { RecoveryManager } from "./recovery-manager.js";
export { SmsRegistry } from "./sms-registry.js";
export { appendSceLog, getSceLogs, resetSceLogsForTesting } from "./sce-logging.js";
