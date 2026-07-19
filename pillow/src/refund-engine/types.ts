/** PILLOW-RF-001 — Refund Engine types (R3-10). */

import type {
  ENGINE_STATES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  RF_CAPABILITIES,
  REFUND_STATUSES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { RefundEngineConfiguration } from "./configuration.js";

export type RefundEngineVersion = "PILLOW-RF-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type EngineState = (typeof ENGINE_STATES)[number];
export type RefundStatus = (typeof REFUND_STATUSES)[number];
export type RfCapability = (typeof RF_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type RefundEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: EngineState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: RfCapability[];
  metadataVersion: string;
  frameworkModuleId: string | null;
  paymentGatewayConnected: boolean;
  bankingIntegrationConnected: boolean;
  revenueEngineConnected: boolean;
  expenseEngineConnected: boolean;
  invoiceGeneratorConnected: boolean;
};

export type RefundRecord = {
  refundId: string;
  timestamp: string;
  paymentReference: string;
  bankingReference: string | null;
  invoiceReference: string | null;
  customerReference: string | null;
  orderReference: string | null;
  refundAmount: number;
  currency: string;
  refundReason: string;
  refundStatus: RefundStatus;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type RefundAnomaly = {
  anomalyId: string;
  timestamp: string;
  severity: "low" | "medium" | "high";
  description: string;
  refundId: string | null;
};

export type RefundValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type RefundEngineRunReport = {
  refundRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "create_refund_request"
    | "validate_eligibility"
    | "process_full_refund"
    | "process_partial_refund";
  engineRecord: RefundEngineRecord;
  refundRecords: RefundRecord[];
  anomalies: RefundAnomaly[];
  validation: RefundValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type RefundHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: RefundValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalRefundRecords: number;
  aggregateRefundAmount: number;
  lastRefundStatus: RefundStatus | null;
  notes: string[];
};

export type RefundPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  refundRequestsCreated: number;
  eligibilityValidations: number;
  fullRefundsProcessed: number;
  partialRefundsProcessed: number;
  anomaliesDetected: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type RefundLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type RefundEngineState = {
  engineVersion: RefundEngineVersion;
  missionId: "R3-10";
  status: EngineStatus;
  initializedAt: string;
  configuration: RefundEngineConfiguration;
  latestReport: RefundEngineRunReport | null;
  engineRecord: RefundEngineRecord | null;
  health: RefundHealthReport;
  performance: RefundPerformanceStats;
};

export type RefundCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: EngineState | null;
  lastDecision: RefundValidationReport["decision"] | null;
  totalRefundRecords: number;
  aggregateRefundAmount: number;
  lastRefundStatus: RefundStatus | null;
  frameworkRegistered: boolean;
  recentLogs: string[];
};

export type ConnectRefundEngineInput = {
  forceReconnect?: boolean;
};

export type CreateRefundRequestInput = {
  paymentReference: string;
  invoiceReference?: string;
  customerReference?: string;
  orderReference?: string;
  refundAmount: number;
  currency?: string;
  refundReason: string;
};

export type ValidateRefundEligibilityInput = {
  paymentReference: string;
  refundAmount: number;
  currency?: string;
};

export type ProcessFullRefundInput = {
  paymentReference: string;
  invoiceReference?: string;
  refundReason: string;
  currency?: string;
};

export type ProcessPartialRefundInput = {
  paymentReference: string;
  invoiceReference?: string;
  refundAmount: number;
  refundReason: string;
  currency?: string;
};
