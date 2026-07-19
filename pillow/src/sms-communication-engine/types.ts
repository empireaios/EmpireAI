/** PILLOW-SCE-001 — SMS Communication Engine types (R4-05). */

import type {
  DELIVERY_STATUSES,
  ENGINE_STATES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  SCE_CAPABILITIES,
  SMS_CATEGORIES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { SmsCommunicationEngineConfiguration } from "./configuration.js";

export type SmsCommunicationEngineVersion = "PILLOW-SCE-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type EngineState = (typeof ENGINE_STATES)[number];
export type SmsCategory = (typeof SMS_CATEGORIES)[number];
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];
export type SceCapability = (typeof SCE_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type SmsTemplate = {
  templateId: string;
  timestamp: string;
  templateName: string;
  smsCategory: SmsCategory;
  bodyTemplate: string;
  enabled: boolean;
  metadataVersion: string;
};

export type SmsEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: EngineState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: SceCapability[];
  crmFoundationConnected: boolean;
  timelineEngineConnected: boolean;
  metadataVersion: string;
};

export type SmsRecord = {
  smsRecordId: string;
  timestamp: string;
  customerId: string;
  smsTemplateReference: string;
  smsCategory: SmsCategory;
  recipientPhoneNumber: string;
  deliveryStatus: DeliveryStatus;
  deliveryTimestamp: string | null;
  retryCount: number;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type SmsFailure = {
  failureId: string;
  timestamp: string;
  smsRecordId: string | null;
  reason: string;
  severity: "low" | "medium" | "high";
  metadataVersion: string;
};

export type SmsValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type SmsRunReport = {
  smsRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "send_transactional"
    | "send_notification"
    | "send_verification"
    | "create_template"
    | "process_queue"
    | "track_confirmation"
    | "retry_sms"
    | "detect_failures";
  engineRecord: SmsEngineRecord;
  smsRecords: SmsRecord[];
  templates: SmsTemplate[];
  failures: SmsFailure[];
  validation: SmsValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type SmsHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: SmsValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalSmsRecords: number;
  queuedSms: number;
  deliveredSms: number;
  failedSms: number;
  notes: string[];
};

export type SmsPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  smsSent: number;
  transactionalSent: number;
  notificationSent: number;
  verificationSent: number;
  templatesCreated: number;
  confirmationsTracked: number;
  retriesPerformed: number;
  failuresDetected: number;
  queueProcessed: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type SmsCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: EngineState | null;
  lastDecision: SmsValidationReport["decision"] | null;
  totalSmsRecords: number;
  queuedSms: number;
  deliveredSms: number;
  crmFoundationConnected: boolean;
  timelineEngineConnected: boolean;
  recentLogs: string[];
};

export type SceLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "debug" | "info" | "warn" | "error";
  details: string;
};

export type ConnectSmsCommunicationEngineInput = {
  forceReconnect?: boolean;
};

export type SendSmsInput = {
  customerId: string;
  recipientPhoneNumber: string;
  templateId?: string;
  body?: string;
};

export type CreateSmsTemplateInput = {
  templateName: string;
  smsCategory: SmsCategory;
  bodyTemplate: string;
};

export type ProcessSmsQueueInput = {
  limit?: number;
};

export type TrackDeliveryConfirmationInput = {
  smsRecordId: string;
};

export type RetrySmsInput = {
  smsRecordId: string;
};

export type DetectSmsFailuresInput = {
  smsRecordId?: string;
};

export type SmsCommunicationEngineState = {
  engineVersion: SmsCommunicationEngineVersion;
  missionId: "R4-05";
  status: EngineStatus;
  initializedAt: string;
  configuration: SmsCommunicationEngineConfiguration;
  latestReport: SmsRunReport | null;
  engineRecord: SmsEngineRecord | null;
  health: SmsHealthReport;
  performance: SmsPerformanceStats;
};
