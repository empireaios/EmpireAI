/** PILLOW-ACS-001 — AI Customer Support types (R4-08). */

import type {
  ACS_CAPABILITIES,
  COMMUNICATION_CHANNELS,
  CUSTOMER_INTENTS,
  ENGINE_STATES,
  ENGINE_STATUSES,
  ESCALATION_STATUSES,
  HEALTH_STATUSES,
  RESOLUTION_STATUSES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { AiCustomerSupportConfiguration } from "./configuration.js";

export type AiCustomerSupportVersion = "PILLOW-ACS-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type EngineState = (typeof ENGINE_STATES)[number];
export type CommunicationChannel = (typeof COMMUNICATION_CHANNELS)[number];
export type CustomerIntent = (typeof CUSTOMER_INTENTS)[number];
export type EscalationStatus = (typeof ESCALATION_STATUSES)[number];
export type ResolutionStatus = (typeof RESOLUTION_STATUSES)[number];
export type AcsCapability = (typeof ACS_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type CustomerContext = {
  contextId: string;
  timestamp: string;
  customerId: string;
  crmProfileFound: boolean;
  timelineRecordCount: number;
  recentTimelineEvents: string[];
  metadataVersion: string;
};

export type AiSupportEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: EngineState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: AcsCapability[];
  identityEngineConnected: boolean;
  crmFoundationConnected: boolean;
  timelineEngineConnected: boolean;
  emailEngineConnected: boolean;
  smsEngineConnected: boolean;
  whatsAppIntegrationConnected: boolean;
  liveChatIntegrationConnected: boolean;
  metadataVersion: string;
};

export type AiSupportRecord = {
  aiSupportRecordId: string;
  timestamp: string;
  customerId: string;
  conversationReference: string;
  communicationChannel: CommunicationChannel;
  customerIntent: CustomerIntent;
  aiResponseReference: string | null;
  escalationStatus: EscalationStatus;
  resolutionStatus: ResolutionStatus;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type AiSupportFailure = {
  failureId: string;
  timestamp: string;
  aiSupportRecordId: string | null;
  reason: string;
  severity: "low" | "medium" | "high";
  metadataVersion: string;
};

export type SupportSummary = {
  summaryId: string;
  timestamp: string;
  aiSupportRecordId: string;
  customerId: string;
  summaryText: string;
  metadataVersion: string;
};

export type AiSupportValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type AiSupportRunReport = {
  aiSupportRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "receive_enquiry"
    | "understand_intent"
    | "retrieve_context"
    | "generate_response"
    | "escalate_enquiry"
    | "multi_channel_support"
    | "generate_summary"
    | "detect_failures";
  engineRecord: AiSupportEngineRecord;
  aiSupportRecords: AiSupportRecord[];
  contexts: CustomerContext[];
  summaries: SupportSummary[];
  failures: AiSupportFailure[];
  validation: AiSupportValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type AiSupportHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: AiSupportValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalAiSupportRecords: number;
  openEnquiries: number;
  escalatedEnquiries: number;
  resolvedEnquiries: number;
  failedEnquiries: number;
  notes: string[];
};

export type AiSupportPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  enquiriesReceived: number;
  intentsUnderstood: number;
  contextsRetrieved: number;
  responsesGenerated: number;
  escalationsPerformed: number;
  multiChannelHandled: number;
  summariesGenerated: number;
  failuresDetected: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
  averageResponseLatencyMs: number;
};

export type AiSupportCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: EngineState | null;
  lastDecision: AiSupportValidationReport["decision"] | null;
  totalAiSupportRecords: number;
  openEnquiries: number;
  escalatedEnquiries: number;
  resolvedEnquiries: number;
  identityEngineConnected: boolean;
  crmFoundationConnected: boolean;
  timelineEngineConnected: boolean;
  recentLogs: string[];
};

export type AcsLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "debug" | "info" | "warn" | "error";
  details: string;
};

export type ConnectAiCustomerSupportInput = {
  forceReconnect?: boolean;
};

export type ReceiveCustomerEnquiryInput = {
  customerId: string;
  communicationChannel: CommunicationChannel;
  enquiryText: string;
  conversationReference?: string;
};

export type UnderstandCustomerIntentInput = {
  aiSupportRecordId: string;
  enquiryText?: string;
};

export type RetrieveCustomerContextInput = {
  customerId: string;
};

export type GenerateAiResponseInput = {
  aiSupportRecordId: string;
  responseText?: string;
};

export type EscalateEnquiryInput = {
  aiSupportRecordId: string;
  reason?: string;
};

export type HandleMultiChannelSupportInput = {
  aiSupportRecordId: string;
  recipientAddress?: string;
  recipientPhoneNumber?: string;
  chatSessionId?: string;
};

export type GenerateSupportSummaryInput = {
  aiSupportRecordId: string;
};

export type DetectSupportFailuresInput = {
  aiSupportRecordId?: string;
};

export type AiCustomerSupportState = {
  engineVersion: AiCustomerSupportVersion;
  missionId: "R4-08";
  status: EngineStatus;
  initializedAt: string;
  configuration: AiCustomerSupportConfiguration;
  latestReport: AiSupportRunReport | null;
  engineRecord: AiSupportEngineRecord | null;
  health: AiSupportHealthReport;
  performance: AiSupportPerformanceStats;
};
