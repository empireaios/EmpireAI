/** PILLOW-ECE-001 — Email Communication Engine types (R4-04). */

import type {
  CLICK_STATUSES,
  DELIVERY_STATUSES,
  ECE_CAPABILITIES,
  EMAIL_CATEGORIES,
  ENGINE_STATES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPEN_STATUSES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { EmailCommunicationEngineConfiguration } from "./configuration.js";

export type EmailCommunicationEngineVersion = "PILLOW-ECE-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type EngineState = (typeof ENGINE_STATES)[number];
export type EmailCategory = (typeof EMAIL_CATEGORIES)[number];
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];
export type OpenStatus = (typeof OPEN_STATUSES)[number];
export type ClickStatus = (typeof CLICK_STATUSES)[number];
export type EceCapability = (typeof ECE_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type EmailTemplate = {
  templateId: string;
  timestamp: string;
  templateName: string;
  emailCategory: EmailCategory;
  subject: string;
  bodyTemplate: string;
  enabled: boolean;
  metadataVersion: string;
};

export type EmailEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: EngineState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: EceCapability[];
  crmFoundationConnected: boolean;
  timelineEngineConnected: boolean;
  metadataVersion: string;
};

export type EmailRecord = {
  emailRecordId: string;
  timestamp: string;
  customerId: string;
  emailTemplateReference: string;
  emailCategory: EmailCategory;
  recipientAddress: string;
  deliveryStatus: DeliveryStatus;
  openStatus: OpenStatus;
  clickStatus: ClickStatus;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type EmailFailure = {
  failureId: string;
  timestamp: string;
  emailRecordId: string | null;
  reason: string;
  severity: "low" | "medium" | "high";
  metadataVersion: string;
};

export type EmailValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type EmailRunReport = {
  emailRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "send_transactional"
    | "send_marketing"
    | "send_notification"
    | "send_support"
    | "create_template"
    | "process_queue"
    | "track_open"
    | "track_click"
    | "detect_failures";
  engineRecord: EmailEngineRecord;
  emailRecords: EmailRecord[];
  templates: EmailTemplate[];
  failures: EmailFailure[];
  validation: EmailValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type EmailHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: EmailValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalEmailRecords: number;
  queuedEmails: number;
  deliveredEmails: number;
  failedEmails: number;
  notes: string[];
};

export type EmailPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  emailsSent: number;
  transactionalSent: number;
  marketingSent: number;
  notificationSent: number;
  supportSent: number;
  templatesCreated: number;
  opensTracked: number;
  clicksTracked: number;
  failuresDetected: number;
  queueProcessed: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type EmailCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: EngineState | null;
  lastDecision: EmailValidationReport["decision"] | null;
  totalEmailRecords: number;
  queuedEmails: number;
  deliveredEmails: number;
  crmFoundationConnected: boolean;
  timelineEngineConnected: boolean;
  recentLogs: string[];
};

export type EceLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "debug" | "info" | "warn" | "error";
  details: string;
};

export type ConnectEmailCommunicationEngineInput = {
  forceReconnect?: boolean;
};

export type SendEmailInput = {
  customerId: string;
  recipientAddress: string;
  templateId?: string;
  subject?: string;
  body?: string;
};

export type CreateEmailTemplateInput = {
  templateName: string;
  emailCategory: EmailCategory;
  subject: string;
  bodyTemplate: string;
};

export type ProcessEmailQueueInput = {
  limit?: number;
};

export type TrackEmailOpenInput = {
  emailRecordId: string;
};

export type TrackEmailClickInput = {
  emailRecordId: string;
};

export type DetectEmailFailuresInput = {
  emailRecordId?: string;
};

export type EmailCommunicationEngineState = {
  engineVersion: EmailCommunicationEngineVersion;
  missionId: "R4-04";
  status: EngineStatus;
  initializedAt: string;
  configuration: EmailCommunicationEngineConfiguration;
  latestReport: EmailRunReport | null;
  engineRecord: EmailEngineRecord | null;
  health: EmailHealthReport;
  performance: EmailPerformanceStats;
};
