/** PILLOW-CSE-001 — Customer Sentiment Engine types (R4-10). */

import type {
  ALERT_STATUSES,
  COMMUNICATION_CHANNELS,
  CSE_CAPABILITIES,
  ENGINE_STATES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  SENTIMENT_CATEGORIES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { CustomerSentimentEngineConfiguration } from "./configuration.js";

export type CustomerSentimentEngineVersion = "PILLOW-CSE-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type EngineState = (typeof ENGINE_STATES)[number];
export type CommunicationChannel = (typeof COMMUNICATION_CHANNELS)[number];
export type SentimentCategory = (typeof SENTIMENT_CATEGORIES)[number];
export type AlertStatus = (typeof ALERT_STATUSES)[number];
export type CseCapability = (typeof CSE_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type SentimentEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: EngineState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: CseCapability[];
  timelineEngineConnected: boolean;
  emailEngineConnected: boolean;
  smsEngineConnected: boolean;
  whatsAppIntegrationConnected: boolean;
  liveChatIntegrationConnected: boolean;
  aiCustomerSupportConnected: boolean;
  ticketManagementEngineConnected: boolean;
  metadataVersion: string;
};

export type SentimentRecord = {
  sentimentRecordId: string;
  timestamp: string;
  customerId: string;
  conversationReference: string;
  communicationChannel: CommunicationChannel;
  sentimentScore: number;
  sentimentCategory: SentimentCategory;
  confidenceScore: number;
  alertStatus: AlertStatus;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type SentimentAlert = {
  alertId: string;
  timestamp: string;
  sentimentRecordId: string;
  customerId: string;
  alertType: "frustration" | "escalation_risk" | "positive_experience" | "satisfaction";
  severity: "low" | "medium" | "high";
  message: string;
  metadataVersion: string;
};

export type SentimentTrend = {
  trendId: string;
  timestamp: string;
  customerId: string;
  conversationReference: string;
  averageScore: number;
  trendDirection: "improving" | "stable" | "declining";
  recordCount: number;
  metadataVersion: string;
};

export type SentimentFailure = {
  failureId: string;
  timestamp: string;
  sentimentRecordId: string | null;
  reason: string;
  severity: "low" | "medium" | "high";
  metadataVersion: string;
};

export type SentimentValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type SentimentRunReport = {
  sentimentRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "analyze_message"
    | "analyze_conversation"
    | "detect_satisfaction"
    | "detect_frustration"
    | "detect_escalation_risk"
    | "detect_positive_experience"
    | "track_trends"
    | "calculate_score"
    | "generate_alerts"
    | "detect_failures";
  engineRecord: SentimentEngineRecord;
  sentimentRecords: SentimentRecord[];
  alerts: SentimentAlert[];
  trends: SentimentTrend[];
  failures: SentimentFailure[];
  validation: SentimentValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type SentimentHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: SentimentValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalSentimentRecords: number;
  positiveRecords: number;
  negativeRecords: number;
  frustratedRecords: number;
  activeAlerts: number;
  failedRecords: number;
  notes: string[];
};

export type SentimentPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  messagesAnalyzed: number;
  conversationsAnalyzed: number;
  satisfactionDetected: number;
  frustrationDetected: number;
  escalationRiskDetected: number;
  positiveExperiencesDetected: number;
  trendsTracked: number;
  scoresCalculated: number;
  alertsGenerated: number;
  failuresDetected: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type SentimentCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: EngineState | null;
  lastDecision: SentimentValidationReport["decision"] | null;
  totalSentimentRecords: number;
  positiveRecords: number;
  negativeRecords: number;
  frustratedRecords: number;
  activeAlerts: number;
  timelineEngineConnected: boolean;
  aiCustomerSupportConnected: boolean;
  ticketManagementEngineConnected: boolean;
  recentLogs: string[];
};

export type CseLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "debug" | "info" | "warn" | "error";
  details: string;
};

export type ConnectCustomerSentimentEngineInput = { forceReconnect?: boolean };
export type AnalyzeCustomerMessageInput = {
  customerId: string;
  messageText: string;
  communicationChannel: CommunicationChannel;
  conversationReference?: string;
};
export type AnalyzeCustomerConversationInput = {
  customerId: string;
  conversationReference: string;
  messages: string[];
  communicationChannel: CommunicationChannel;
};
export type DetectCustomerSatisfactionInput = { customerId?: string; sentimentRecordId?: string };
export type DetectCustomerFrustrationInput = { customerId?: string; sentimentRecordId?: string };
export type DetectEscalationRiskInput = { customerId?: string; sentimentRecordId?: string };
export type DetectPositiveExperienceInput = { customerId?: string; sentimentRecordId?: string };
export type TrackSentimentTrendsInput = { customerId: string; conversationReference?: string };
export type CalculateSentimentScoreInput = { sentimentRecordId: string };
export type GenerateSentimentAlertsInput = { sentimentRecordId?: string };
export type DetectSentimentFailuresInput = { sentimentRecordId?: string };

export type CustomerSentimentEngineState = {
  engineVersion: CustomerSentimentEngineVersion;
  missionId: "R4-10";
  status: EngineStatus;
  initializedAt: string;
  configuration: CustomerSentimentEngineConfiguration;
  latestReport: SentimentRunReport | null;
  engineRecord: SentimentEngineRecord | null;
  health: SentimentHealthReport;
  performance: SentimentPerformanceStats;
};
