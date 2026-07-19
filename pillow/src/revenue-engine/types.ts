/** PILLOW-RE-001 — Revenue Engine types (R3-04). */

import type {
  ENGINE_STATES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  RE_CAPABILITIES,
  REVENUE_SOURCES,
  REVENUE_STATUSES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { RevenueEngineConfiguration } from "./configuration.js";

export type RevenueEngineVersion = "PILLOW-RE-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type EngineState = (typeof ENGINE_STATES)[number];
export type RevenueSource = (typeof REVENUE_SOURCES)[number];
export type RevenueStatus = (typeof REVENUE_STATUSES)[number];
export type ReCapability = (typeof RE_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type RevenueEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: EngineState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: ReCapability[];
  metadataVersion: string;
  frameworkModuleId: string | null;
  paymentGatewayConnected: boolean;
  bankingIntegrationConnected: boolean;
};

export type RevenueRecord = {
  revenueRecordId: string;
  timestamp: string;
  revenueSource: RevenueSource;
  paymentReference: string | null;
  bankingReference: string | null;
  marketplaceReference: string | null;
  customerReference: string | null;
  businessReference: string | null;
  grossRevenue: number;
  netRevenue: number;
  currency: string;
  revenueStatus: RevenueStatus;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type RevenueAggregationSummary = {
  summaryId: string;
  timestamp: string;
  grossRevenue: number;
  netRevenue: number;
  currency: string;
  totalRecords: number;
  byMarketplace: Record<string, { grossRevenue: number; netRevenue: number; count: number }>;
  byBusiness: Record<string, { grossRevenue: number; netRevenue: number; count: number }>;
  metadataVersion: string;
};

export type RevenueAnomaly = {
  anomalyId: string;
  timestamp: string;
  severity: "low" | "medium" | "high";
  description: string;
  revenueRecordId: string | null;
};

export type RevenueValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type RevenueEngineRunReport = {
  revenueRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "record_event"
    | "record_payment"
    | "record_marketplace"
    | "record_settlement"
    | "record_refund"
    | "aggregate";
  engineRecord: RevenueEngineRecord;
  revenueRecords: RevenueRecord[];
  aggregation: RevenueAggregationSummary | null;
  anomalies: RevenueAnomaly[];
  validation: RevenueValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type RevenueHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: RevenueValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalRevenueRecords: number;
  grossRevenue: number;
  netRevenue: number;
  notes: string[];
};

export type RevenuePerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  revenueEventsRecorded: number;
  paymentsRecorded: number;
  marketplaceRevenueRecorded: number;
  settlementsRecorded: number;
  refundsRecorded: number;
  aggregationsRun: number;
  anomaliesDetected: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type RevenueLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type RevenueEngineState = {
  engineVersion: RevenueEngineVersion;
  missionId: "R3-04";
  status: EngineStatus;
  initializedAt: string;
  configuration: RevenueEngineConfiguration;
  latestReport: RevenueEngineRunReport | null;
  engineRecord: RevenueEngineRecord | null;
  health: RevenueHealthReport;
  performance: RevenuePerformanceStats;
};

export type RevenueCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: EngineState | null;
  lastDecision: RevenueValidationReport["decision"] | null;
  totalRevenueRecords: number;
  grossRevenue: number;
  netRevenue: number;
  frameworkRegistered: boolean;
  recentLogs: string[];
};

export type ConnectRevenueEngineInput = {
  forceReconnect?: boolean;
};

export type RecordRevenueEventInput = {
  revenueSource: RevenueSource;
  paymentReference?: string;
  bankingReference?: string;
  marketplaceReference?: string;
  customerReference?: string;
  businessReference?: string;
  grossRevenue: number;
  netRevenue?: number;
  currency?: string;
};

export type RecordCompletedPaymentInput = {
  paymentId: string;
  businessReference?: string;
};

export type RecordMarketplaceRevenueInput = {
  marketplaceReference: string;
  customerReference?: string;
  businessReference?: string;
  grossRevenue: number;
  netRevenue?: number;
  currency?: string;
};

export type RecordSupplierSettlementInput = {
  bankingReference: string;
  businessReference?: string;
  grossRevenue: number;
  netRevenue?: number;
  currency?: string;
};

export type RecordRevenueRefundInput = {
  paymentReference: string;
  refundAmount: number;
  currency?: string;
  businessReference?: string;
};

export type AggregateRevenueInput = {
  currency?: string;
  businessReference?: string;
  marketplaceReference?: string;
};
