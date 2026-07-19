/** PILLOW-ECE-001 — Email Communication Engine (R4-04). */

export {
  EMAIL_COMMUNICATION_ENGINE_SYSTEM_PATH,
  ECE_METADATA_VERSION,
  EMAIL_COMMUNICATION_ENGINE_ID,
  ENGINE_STATUSES,
  ENGINE_STATES,
  EMAIL_CATEGORIES,
  DELIVERY_STATUSES,
  OPEN_STATUSES,
  CLICK_STATUSES,
  ECE_CAPABILITIES,
  VALIDATION_STATUSES,
  HEALTH_STATUSES,
} from "./paths.js";

export {
  buildEmailCommunicationEngineConfiguration,
  loadEmailCommunicationEngineConfigFile,
  DEFAULT_EMAIL_COMMUNICATION_ENGINE_CONFIGURATION,
  type EmailCommunicationEngineConfiguration,
  type DeliveryRule,
  type TemplateRule,
  type QueueRule,
} from "./configuration.js";

export type {
  EmailCommunicationEngineVersion,
  EngineStatus,
  EngineState,
  EmailCategory,
  DeliveryStatus,
  OpenStatus,
  ClickStatus,
  EceCapability,
  ValidationStatus,
  HealthStatus,
  EmailTemplate,
  EmailEngineRecord,
  EmailRecord,
  EmailFailure,
  EmailValidationReport,
  EmailRunReport,
  EmailHealthReport,
  EmailPerformanceStats,
  EmailCockpitSnapshot,
  EceLogEntry,
  ConnectEmailCommunicationEngineInput,
  SendEmailInput,
  CreateEmailTemplateInput,
  ProcessEmailQueueInput,
  TrackEmailOpenInput,
  TrackEmailClickInput,
  DetectEmailFailuresInput,
  EmailCommunicationEngineState,
} from "./types.js";

export {
  EmailCommunicationEngine,
  createEmailCommunicationEngine,
  resetEmailCommunicationEngineForTesting,
  type EmailCommunicationEngineOptions,
} from "./engine.js";

export { EmailCommunicationManager } from "./email-communication-manager.js";
export { EmailCommunicationController } from "./email-communication-controller.js";
export { EmailDeliveryEngine } from "./email-delivery-engine.js";
export { EmailTemplateManager } from "./email-template-manager.js";
export { EmailQueueManager } from "./email-queue-manager.js";
export { EmailTrackingEngine } from "./email-tracking-engine.js";
export { EmailAnalyticsEngine } from "./email-analytics-engine.js";
export { EmailValidationEngine } from "./email-validation-engine.js";
export { EmailMetadataGenerator } from "./email-metadata-generator.js";
export { EmailValidator } from "./email-validator.js";
export { HealthMonitor } from "./health-monitor.js";
export { RecoveryManager } from "./recovery-manager.js";
export { EmailRegistry } from "./email-registry.js";
export { appendEceLog, getEceLogs, resetEceLogsForTesting } from "./ece-logging.js";
