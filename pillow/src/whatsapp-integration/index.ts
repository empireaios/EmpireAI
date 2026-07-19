/** PILLOW-WAI-001 — WhatsApp Integration (R4-06). */

export {
  WHATSAPP_INTEGRATION_SYSTEM_PATH,
  WAI_METADATA_VERSION,
  WHATSAPP_INTEGRATION_ID,
  ENGINE_STATUSES,
  ENGINE_STATES,
  MESSAGE_CATEGORIES,
  DELIVERY_STATUSES,
  READ_STATUSES,
  CONVERSATION_STATUSES,
  WAI_CAPABILITIES,
  VALIDATION_STATUSES,
  HEALTH_STATUSES,
} from "./paths.js";

export {
  buildWhatsAppIntegrationConfiguration,
  loadWhatsAppIntegrationConfigFile,
  DEFAULT_WHATSAPP_INTEGRATION_CONFIGURATION,
  type WhatsAppIntegrationConfiguration,
  type MessagingRule,
  type TemplateRule,
  type ConversationRule,
} from "./configuration.js";

export type {
  WhatsAppIntegrationVersion,
  EngineStatus,
  EngineState,
  MessageCategory,
  DeliveryStatus,
  ReadStatus,
  ConversationStatus,
  WaiCapability,
  ValidationStatus,
  HealthStatus,
  WhatsAppTemplate,
  WhatsAppConversation,
  WhatsAppEngineRecord,
  WhatsAppRecord,
  WhatsAppFailure,
  WhatsAppValidationReport,
  WhatsAppRunReport,
  WhatsAppHealthReport,
  WhatsAppPerformanceStats,
  WhatsAppCockpitSnapshot,
  WaiLogEntry,
  ConnectWhatsAppIntegrationInput,
  SendWhatsAppInput,
  ReceiveInboundMessageInput,
  ManageConversationInput,
  CreateWhatsAppTemplateInput,
  ProcessMessageQueueInput,
  TrackDeliveryInput,
  TrackReadReceiptInput,
  DetectMessagingFailuresInput,
  WhatsAppIntegrationState,
} from "./types.js";

export {
  WhatsAppIntegration,
  createWhatsAppIntegration,
  resetWhatsAppIntegrationForTesting,
  type WhatsAppIntegrationOptions,
} from "./engine.js";

export { WhatsAppIntegrationManager } from "./whatsapp-integration-manager.js";
export { WhatsAppIntegrationController } from "./whatsapp-integration-controller.js";
export { WhatsAppApiClient } from "./whatsapp-api-client.js";
export { WhatsAppMessagingEngine } from "./whatsapp-messaging-engine.js";
export { ConversationManager } from "./conversation-manager.js";
export { WhatsAppTemplateManager } from "./whatsapp-template-manager.js";
export { WhatsAppTrackingEngine } from "./whatsapp-tracking-engine.js";
export { WhatsAppAnalyticsEngine } from "./whatsapp-analytics-engine.js";
export { WhatsAppValidationEngine } from "./whatsapp-validation-engine.js";
export { WhatsAppMetadataGenerator } from "./whatsapp-metadata-generator.js";
export { WhatsAppValidator } from "./whatsapp-validator.js";
export { HealthMonitor } from "./health-monitor.js";
export { RecoveryManager } from "./recovery-manager.js";
export { WhatsAppRegistry } from "./whatsapp-registry.js";
export { appendWaiLog, getWaiLogs, resetWaiLogsForTesting } from "./wai-logging.js";
