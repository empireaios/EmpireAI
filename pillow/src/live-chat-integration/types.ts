/** PILLOW-LCI-001 — Live Chat Integration types (R4-07). */

import type {
  CHAT_STATUSES,
  ENGINE_STATES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  LCI_CAPABILITIES,
  MESSAGE_SENDERS,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { LiveChatIntegrationConfiguration } from "./configuration.js";

export type LiveChatIntegrationVersion = "PILLOW-LCI-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type EngineState = (typeof ENGINE_STATES)[number];
export type ChatStatus = (typeof CHAT_STATUSES)[number];
export type MessageSender = (typeof MESSAGE_SENDERS)[number];
export type LciCapability = (typeof LCI_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type ChatMessage = {
  messageId: string;
  timestamp: string;
  chatSessionId: string;
  conversationId: string;
  customerId: string;
  sender: MessageSender;
  body: string;
  metadataVersion: string;
};

export type ChatConversation = {
  conversationId: string;
  timestamp: string;
  customerId: string;
  chatSessionId: string;
  status: ChatStatus;
  messageCount: number;
  lastMessageAt: string | null;
  metadataVersion: string;
};

export type LiveChatEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: EngineState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: LciCapability[];
  timelineEngineConnected: boolean;
  metadataVersion: string;
};

export type LiveChatRecord = {
  chatSessionId: string;
  timestamp: string;
  customerId: string;
  conversationId: string;
  messageReferences: string[];
  chatStatus: ChatStatus;
  assignedHandler: string | null;
  responseTimeMs: number | null;
  relatedTimelineEvent: string | null;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type LiveChatFailure = {
  failureId: string;
  timestamp: string;
  chatSessionId: string | null;
  reason: string;
  severity: "low" | "medium" | "high";
  metadataVersion: string;
};

export type LiveChatValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type LiveChatRunReport = {
  liveChatRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "create_session"
    | "receive_message"
    | "send_response"
    | "manage_conversation"
    | "process_queue"
    | "assign_session"
    | "track_status"
    | "track_response_time"
    | "detect_failures";
  engineRecord: LiveChatEngineRecord;
  liveChatRecords: LiveChatRecord[];
  conversations: ChatConversation[];
  messages: ChatMessage[];
  failures: LiveChatFailure[];
  validation: LiveChatValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type LiveChatHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: LiveChatValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalLiveChatRecords: number;
  waitingSessions: number;
  activeSessions: number;
  failedSessions: number;
  queuedMessages: number;
  notes: string[];
};

export type LiveChatPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  sessionsCreated: number;
  customerMessagesReceived: number;
  supportResponsesSent: number;
  conversationsManaged: number;
  queueProcessed: number;
  sessionsAssigned: number;
  statusTracked: number;
  responseTimesTracked: number;
  failuresDetected: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
  averageResponseTimeMs: number;
};

export type LiveChatCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: EngineState | null;
  lastDecision: LiveChatValidationReport["decision"] | null;
  totalLiveChatRecords: number;
  waitingSessions: number;
  activeSessions: number;
  queuedMessages: number;
  timelineEngineConnected: boolean;
  recentLogs: string[];
};

export type LciLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "debug" | "info" | "warn" | "error";
  details: string;
};

export type ConnectLiveChatIntegrationInput = {
  forceReconnect?: boolean;
};

export type CreateChatSessionInput = {
  customerId: string;
  conversationId?: string;
};

export type ReceiveCustomerMessageInput = {
  chatSessionId: string;
  body: string;
};

export type SendSupportResponseInput = {
  chatSessionId: string;
  handlerId: string;
  body: string;
};

export type ManageChatConversationInput = {
  conversationId: string;
  status?: ChatStatus;
};

export type ProcessChatQueueInput = {
  limit?: number;
};

export type AssignChatSessionInput = {
  chatSessionId: string;
  handlerId: string;
};

export type TrackChatStatusInput = {
  chatSessionId: string;
  chatStatus: ChatStatus;
};

export type TrackResponseTimeInput = {
  chatSessionId: string;
  responseTimeMs: number;
};

export type DetectChatFailuresInput = {
  chatSessionId?: string;
};

export type LiveChatIntegrationState = {
  engineVersion: LiveChatIntegrationVersion;
  missionId: "R4-07";
  status: EngineStatus;
  initializedAt: string;
  configuration: LiveChatIntegrationConfiguration;
  latestReport: LiveChatRunReport | null;
  engineRecord: LiveChatEngineRecord | null;
  health: LiveChatHealthReport;
  performance: LiveChatPerformanceStats;
};
