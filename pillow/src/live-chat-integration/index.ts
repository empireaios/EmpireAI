/** PILLOW-LCI-001 — Live Chat Integration (R4-07). */

export {
  LIVE_CHAT_INTEGRATION_SYSTEM_PATH,
  LCI_METADATA_VERSION,
  LIVE_CHAT_INTEGRATION_ID,
  ENGINE_STATUSES,
  ENGINE_STATES,
  CHAT_STATUSES,
  MESSAGE_SENDERS,
  LCI_CAPABILITIES,
  VALIDATION_STATUSES,
  HEALTH_STATUSES,
} from "./paths.js";

export {
  buildLiveChatIntegrationConfiguration,
  loadLiveChatIntegrationConfigFile,
  DEFAULT_LIVE_CHAT_INTEGRATION_CONFIGURATION,
  type LiveChatIntegrationConfiguration,
  type ChatSessionRule,
  type ChatQueueRule,
  type AssignmentRule,
  type TimeoutRule,
} from "./configuration.js";

export type {
  LiveChatIntegrationVersion,
  EngineStatus,
  EngineState,
  ChatStatus,
  MessageSender,
  LciCapability,
  ValidationStatus,
  HealthStatus,
  ChatMessage,
  ChatConversation,
  LiveChatEngineRecord,
  LiveChatRecord,
  LiveChatFailure,
  LiveChatValidationReport,
  LiveChatRunReport,
  LiveChatHealthReport,
  LiveChatPerformanceStats,
  LiveChatCockpitSnapshot,
  LciLogEntry,
  ConnectLiveChatIntegrationInput,
  CreateChatSessionInput,
  ReceiveCustomerMessageInput,
  SendSupportResponseInput,
  ManageChatConversationInput,
  ProcessChatQueueInput,
  AssignChatSessionInput,
  TrackChatStatusInput,
  TrackResponseTimeInput,
  DetectChatFailuresInput,
  LiveChatIntegrationState,
} from "./types.js";

export {
  LiveChatIntegration,
  createLiveChatIntegration,
  resetLiveChatIntegrationForTesting,
  type LiveChatIntegrationOptions,
} from "./engine.js";

export { LiveChatIntegrationManager } from "./live-chat-integration-manager.js";
export { LiveChatIntegrationController } from "./live-chat-integration-controller.js";
export { ChatSessionManager } from "./chat-session-manager.js";
export { ChatMessageEngine } from "./chat-message-engine.js";
export { ChatQueueManager } from "./chat-queue-manager.js";
export { ChatAssignmentEngine } from "./chat-assignment-engine.js";
export { ChatTimelineMapper } from "./chat-timeline-mapper.js";
export { ChatAnalyticsEngine } from "./chat-analytics-engine.js";
export { ChatValidationEngine } from "./chat-validation-engine.js";
export { ChatMetadataGenerator } from "./chat-metadata-generator.js";
export { ChatValidator } from "./chat-validator.js";
export { HealthMonitor } from "./health-monitor.js";
export { RecoveryManager } from "./recovery-manager.js";
export { LiveChatRegistry } from "./live-chat-registry.js";
export { appendLciLog, getLciLogs, resetLciLogsForTesting } from "./lci-logging.js";
