/** PILLOW-ACS-001 — AI Customer Support (R4-08). */

export {
  AI_CUSTOMER_SUPPORT_SYSTEM_PATH,
  ACS_METADATA_VERSION,
  AI_CUSTOMER_SUPPORT_ID,
  ENGINE_STATUSES,
  ENGINE_STATES,
  COMMUNICATION_CHANNELS,
  CUSTOMER_INTENTS,
  ESCALATION_STATUSES,
  RESOLUTION_STATUSES,
  ACS_CAPABILITIES,
  VALIDATION_STATUSES,
  HEALTH_STATUSES,
} from "./paths.js";

export {
  buildAiCustomerSupportConfiguration,
  loadAiCustomerSupportConfigFile,
  DEFAULT_AI_CUSTOMER_SUPPORT_CONFIGURATION,
  type AiCustomerSupportConfiguration,
  type EscalationRule,
  type ResponseGenerationRule,
  type ChannelRule,
} from "./configuration.js";

export type {
  AiCustomerSupportVersion,
  EngineStatus,
  EngineState,
  CommunicationChannel,
  CustomerIntent,
  EscalationStatus,
  ResolutionStatus,
  AcsCapability,
  ValidationStatus,
  HealthStatus,
  CustomerContext,
  AiSupportEngineRecord,
  AiSupportRecord,
  AiSupportFailure,
  SupportSummary,
  AiSupportValidationReport,
  AiSupportRunReport,
  AiSupportHealthReport,
  AiSupportPerformanceStats,
  AiSupportCockpitSnapshot,
  AcsLogEntry,
  ConnectAiCustomerSupportInput,
  ReceiveCustomerEnquiryInput,
  UnderstandCustomerIntentInput,
  RetrieveCustomerContextInput,
  GenerateAiResponseInput,
  EscalateEnquiryInput,
  HandleMultiChannelSupportInput,
  GenerateSupportSummaryInput,
  DetectSupportFailuresInput,
  AiCustomerSupportState,
} from "./types.js";

export {
  AiCustomerSupport,
  createAiCustomerSupport,
  resetAiCustomerSupportForTesting,
  type AiCustomerSupportOptions,
} from "./engine.js";

export { AiCustomerSupportManager } from "./ai-customer-support-manager.js";
export { AiCustomerSupportController } from "./ai-customer-support-controller.js";
export { CustomerIntentEngine } from "./customer-intent-engine.js";
export { CustomerContextEngine } from "./customer-context-engine.js";
export { ResponseGenerationEngine } from "./response-generation-engine.js";
export { EscalationEngine } from "./escalation-engine.js";
export { MultiChannelSupportEngine } from "./multi-channel-support-engine.js";
export { SupportAnalyticsEngine } from "./support-analytics-engine.js";
export { SupportValidationEngine } from "./support-validation-engine.js";
export { SupportMetadataGenerator } from "./support-metadata-generator.js";
export { SupportValidator } from "./support-validator.js";
export { HealthMonitor } from "./health-monitor.js";
export { RecoveryManager } from "./recovery-manager.js";
export { AiSupportRegistry } from "./ai-support-registry.js";
export { appendAcsLog, getAcsLogs, resetAcsLogsForTesting } from "./acs-logging.js";
