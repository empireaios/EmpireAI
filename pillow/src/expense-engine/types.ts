/** PILLOW-EX-001 — Expense Engine types (R3-05). */

import type {
  ENGINE_STATES,
  ENGINE_STATUSES,
  EXPENSE_CATEGORIES,
  EXPENSE_SOURCES,
  EXPENSE_STATUSES,
  EX_CAPABILITIES,
  HEALTH_STATUSES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { ExpenseEngineConfiguration } from "./configuration.js";

export type ExpenseEngineVersion = "PILLOW-EX-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type EngineState = (typeof ENGINE_STATES)[number];
export type ExpenseSource = (typeof EXPENSE_SOURCES)[number];
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
export type ExpenseStatus = (typeof EXPENSE_STATUSES)[number];
export type ExCapability = (typeof EX_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type ExpenseEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: EngineState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: ExCapability[];
  metadataVersion: string;
  frameworkModuleId: string | null;
  paymentGatewayConnected: boolean;
  bankingIntegrationConnected: boolean;
  revenueEngineConnected: boolean;
};

export type ExpenseRecord = {
  expenseRecordId: string;
  timestamp: string;
  expenseSource: ExpenseSource;
  paymentReference: string | null;
  bankingReference: string | null;
  supplierReference: string | null;
  expenseCategory: ExpenseCategory;
  expenseAmount: number;
  currency: string;
  expenseStatus: ExpenseStatus;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type ExpenseAggregationSummary = {
  summaryId: string;
  timestamp: string;
  totalExpenses: number;
  currency: string;
  totalRecords: number;
  byCategory: Record<string, { totalAmount: number; count: number }>;
  recurringTotal: number;
  metadataVersion: string;
};

export type ExpenseAnomaly = {
  anomalyId: string;
  timestamp: string;
  severity: "low" | "medium" | "high";
  description: string;
  expenseRecordId: string | null;
};

export type ExpenseValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type ExpenseEngineRunReport = {
  expenseRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "record_event"
    | "record_supplier_payment"
    | "record_shipping"
    | "record_advertising"
    | "record_platform_fee"
    | "record_operational"
    | "aggregate";
  engineRecord: ExpenseEngineRecord;
  expenseRecords: ExpenseRecord[];
  aggregation: ExpenseAggregationSummary | null;
  anomalies: ExpenseAnomaly[];
  validation: ExpenseValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type ExpenseHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: ExpenseValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalExpenseRecords: number;
  totalExpenses: number;
  recurringExpenses: number;
  notes: string[];
};

export type ExpensePerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  expenseEventsRecorded: number;
  supplierPaymentsRecorded: number;
  shippingExpensesRecorded: number;
  advertisingExpensesRecorded: number;
  platformFeesRecorded: number;
  operationalExpensesRecorded: number;
  aggregationsRun: number;
  anomaliesDetected: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type ExpenseLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type ExpenseEngineState = {
  engineVersion: ExpenseEngineVersion;
  missionId: "R3-05";
  status: EngineStatus;
  initializedAt: string;
  configuration: ExpenseEngineConfiguration;
  latestReport: ExpenseEngineRunReport | null;
  engineRecord: ExpenseEngineRecord | null;
  health: ExpenseHealthReport;
  performance: ExpensePerformanceStats;
};

export type ExpenseCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: EngineState | null;
  lastDecision: ExpenseValidationReport["decision"] | null;
  totalExpenseRecords: number;
  totalExpenses: number;
  recurringExpenses: number;
  frameworkRegistered: boolean;
  recentLogs: string[];
};

export type ConnectExpenseEngineInput = {
  forceReconnect?: boolean;
};

export type RecordExpenseEventInput = {
  expenseSource: ExpenseSource;
  expenseCategory?: ExpenseCategory;
  paymentReference?: string;
  bankingReference?: string;
  supplierReference?: string;
  expenseAmount: number;
  currency?: string;
  recurring?: boolean;
};

export type RecordSupplierPaymentInput = {
  supplierReference: string;
  paymentReference?: string;
  bankingReference?: string;
  expenseAmount: number;
  currency?: string;
  recurring?: boolean;
};

export type RecordShippingExpenseInput = {
  expenseAmount: number;
  paymentReference?: string;
  currency?: string;
  recurring?: boolean;
};

export type RecordAdvertisingExpenseInput = {
  expenseAmount: number;
  paymentReference?: string;
  currency?: string;
  recurring?: boolean;
};

export type RecordPlatformFeeInput = {
  expenseAmount: number;
  paymentReference?: string;
  currency?: string;
  recurring?: boolean;
};

export type RecordOperationalExpenseInput = {
  expenseAmount: number;
  paymentReference?: string;
  bankingReference?: string;
  currency?: string;
  recurring?: boolean;
};

export type AggregateExpensesInput = {
  currency?: string;
  expenseCategory?: ExpenseCategory;
};
