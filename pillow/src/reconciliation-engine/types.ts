/** PILLOW-RC-001 — Reconciliation Engine types (R3-08). */

import type {
  ENGINE_STATES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  RC_CAPABILITIES,
  RECONCILIATION_STATUSES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { ReconciliationEngineConfiguration } from "./configuration.js";

export type ReconciliationEngineVersion = "PILLOW-RC-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type EngineState = (typeof ENGINE_STATES)[number];
export type ReconciliationStatus = (typeof RECONCILIATION_STATUSES)[number];
export type RcCapability = (typeof RC_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type ReconciliationEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: EngineState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: RcCapability[];
  metadataVersion: string;
  frameworkModuleId: string | null;
  paymentGatewayConnected: boolean;
  bankingIntegrationConnected: boolean;
  revenueEngineConnected: boolean;
  expenseEngineConnected: boolean;
  cashFlowMonitorConnected: boolean;
};

export type ReconciliationRecord = {
  reconciliationRecordId: string;
  timestamp: string;
  bankingReference: string | null;
  paymentReference: string | null;
  revenueReference: string | null;
  expenseReference: string | null;
  cashFlowReference: string | null;
  matchedTransactionCount: number;
  unmatchedTransactionCount: number;
  differenceAmount: number;
  reconciliationStatus: ReconciliationStatus;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type ReconciliationMismatch = {
  mismatchId: string;
  timestamp: string;
  severity: "low" | "medium" | "high";
  description: string;
  reconciliationRecordId: string | null;
  sourceType: "payment" | "banking" | "revenue" | "expense" | "cash_flow";
};

export type ReconciliationReport = {
  reportId: string;
  timestamp: string;
  scope: string;
  totalMatched: number;
  totalUnmatched: number;
  totalDifferenceAmount: number;
  reconciliationStatus: ReconciliationStatus;
  metadataVersion: string;
};

export type ReconciliationValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type ReconciliationRunReport = {
  reconciliationRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "reconcile_payments"
    | "reconcile_banking"
    | "reconcile_revenue"
    | "reconcile_expenses"
    | "reconcile_cash_flow"
    | "reconcile_all";
  engineRecord: ReconciliationEngineRecord;
  reconciliationRecords: ReconciliationRecord[];
  report: ReconciliationReport | null;
  mismatches: ReconciliationMismatch[];
  validation: ReconciliationValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type ReconciliationHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: ReconciliationValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalReconciliationRecords: number;
  aggregateDifferenceAmount: number;
  lastReconciliationStatus: ReconciliationStatus | null;
  notes: string[];
};

export type ReconciliationPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  paymentReconciliations: number;
  bankingReconciliations: number;
  revenueReconciliations: number;
  expenseReconciliations: number;
  cashFlowReconciliations: number;
  fullReconciliations: number;
  mismatchesDetected: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type ReconciliationLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type ReconciliationEngineState = {
  engineVersion: ReconciliationEngineVersion;
  missionId: "R3-08";
  status: EngineStatus;
  initializedAt: string;
  configuration: ReconciliationEngineConfiguration;
  latestReport: ReconciliationRunReport | null;
  engineRecord: ReconciliationEngineRecord | null;
  health: ReconciliationHealthReport;
  performance: ReconciliationPerformanceStats;
};

export type ReconciliationCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: EngineState | null;
  lastDecision: ReconciliationValidationReport["decision"] | null;
  totalReconciliationRecords: number;
  aggregateDifferenceAmount: number;
  lastReconciliationStatus: ReconciliationStatus | null;
  frameworkRegistered: boolean;
  recentLogs: string[];
};

export type ConnectReconciliationEngineInput = {
  forceReconnect?: boolean;
};

export type ReconcilePaymentsInput = {
  paymentReference?: string;
  currency?: string;
};

export type ReconcileBankingInput = {
  bankingReference?: string;
  currency?: string;
};

export type ReconcileRevenueInput = {
  revenueReference?: string;
  currency?: string;
};

export type ReconcileExpensesInput = {
  expenseReference?: string;
  currency?: string;
};

export type ReconcileCashFlowInput = {
  cashFlowReference?: string;
  currency?: string;
};

export type ReconcileAllInput = {
  currency?: string;
};
