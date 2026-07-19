/** PILLOW-WAI-001 — WhatsApp Integration types (R4-06). */

import type {
  CONVERSATION_STATUSES,
  DELIVERY_STATUSES,
  ENGINE_STATES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  MESSAGE_CATEGORIES,
  READ_STATUSES,
  VALIDATION_STATUSES,
  WAI_CAPABILITIES,
} from "./paths.js";
import type { WhatsAppIntegrationConfiguration } from "./configuration.js";

export type WhatsAppIntegrationVersion = "PILLOW-WAI-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type EngineState = (typeof ENGINE_STATES)[number];
export type MessageCategory = (typeof MESSAGE_CATEGORIES)[number];
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];
export type ReadStatus = (typeof READ_STATUSES)[number];
export type ConversationStatus = (typeof CONVERSATION_STATUSES)[number];
export type WaiCapability = (typeof WAI_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type WhatsAppTemplate = {
  templateId: string;
  timestamp: string;
  templateName: string;
  messageCategory: MessageCategory;
  bodyTemplate: string;
  enabled: boolean;
  metadataVersion: string;
};

export type WhatsAppConversation = {
  conversationId: string;
  timestamp: string;
  customerId: string;
  recipientPhoneNumber: string;
  status: ConversationStatus;
  lastMessageAt: string | null;
  messageCount: number;
  metadataVersion: string;
};

export type WhatsAppEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: EngineState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: WaiCapability[];
  crmFoundationConnected: boolean;
  timelineEngineConnected: boolean;
  metadataVersion: string;
};

export type WhatsAppRecord = {
  whatsAppRecordId: string;
  timestamp: string;
  customerId: string;
  conversationId: string;
  messageTemplateReference: string;
  messageCategory: MessageCategory;
  recipientPhoneNumber: string;
  deliveryStatus: DeliveryStatus;
  readStatus: ReadStatus;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type WhatsAppFailure = {
  failureId: string;
  timestamp: string;
  whatsAppRecordId: string | null;
  reason: string;
  severity: "low" | "medium" | "high";
  metadataVersion: string;
};

export type WhatsAppValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type WhatsAppRunReport = {
  whatsAppRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "send_transactional"
    | "send_notification"
    | "send_template"
    | "receive_inbound"
    | "manage_conversation"
    | "create_template"
    | "process_queue"
    | "track_delivery"
    | "track_read_receipt"
    | "detect_failures";
  engineRecord: WhatsAppEngineRecord;
  whatsAppRecords: WhatsAppRecord[];
  conversations: WhatsAppConversation[];
  templates: WhatsAppTemplate[];
  failures: WhatsAppFailure[];
  validation: WhatsAppValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type WhatsAppHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: WhatsAppValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalWhatsAppRecords: number;
  queuedMessages: number;
  deliveredMessages: number;
  failedMessages: number;
  activeConversations: number;
  notes: string[];
};

export type WhatsAppPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  messagesSent: number;
  transactionalSent: number;
  notificationSent: number;
  templateSent: number;
  inboundReceived: number;
  templatesCreated: number;
  conversationsManaged: number;
  deliveriesTracked: number;
  readReceiptsTracked: number;
  failuresDetected: number;
  queueProcessed: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type WhatsAppCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: EngineState | null;
  lastDecision: WhatsAppValidationReport["decision"] | null;
  totalWhatsAppRecords: number;
  queuedMessages: number;
  deliveredMessages: number;
  activeConversations: number;
  crmFoundationConnected: boolean;
  timelineEngineConnected: boolean;
  recentLogs: string[];
};

export type WaiLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "debug" | "info" | "warn" | "error";
  details: string;
};

export type ConnectWhatsAppIntegrationInput = {
  forceReconnect?: boolean;
};

export type SendWhatsAppInput = {
  customerId: string;
  recipientPhoneNumber: string;
  conversationId?: string;
  templateId?: string;
  body?: string;
};

export type ReceiveInboundMessageInput = {
  customerId: string;
  senderPhoneNumber: string;
  body: string;
  conversationId?: string;
};

export type ManageConversationInput = {
  customerId: string;
  recipientPhoneNumber: string;
  conversationId?: string;
  status?: ConversationStatus;
};

export type CreateWhatsAppTemplateInput = {
  templateName: string;
  messageCategory: MessageCategory;
  bodyTemplate: string;
};

export type ProcessMessageQueueInput = {
  limit?: number;
};

export type TrackDeliveryInput = {
  whatsAppRecordId: string;
};

export type TrackReadReceiptInput = {
  whatsAppRecordId: string;
};

export type DetectMessagingFailuresInput = {
  whatsAppRecordId?: string;
};

export type WhatsAppIntegrationState = {
  engineVersion: WhatsAppIntegrationVersion;
  missionId: "R4-06";
  status: EngineStatus;
  initializedAt: string;
  configuration: WhatsAppIntegrationConfiguration;
  latestReport: WhatsAppRunReport | null;
  engineRecord: WhatsAppEngineRecord | null;
  health: WhatsAppHealthReport;
  performance: WhatsAppPerformanceStats;
};
