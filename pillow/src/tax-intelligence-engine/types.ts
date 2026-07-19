/** PILLOW-TX-001 — Tax Intelligence Engine types (R3-11). */

import type {
  ENGINE_STATES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  TAX_CATEGORIES,
  TAX_STATUSES,
  TX_CAPABILITIES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { TaxIntelligenceEngineConfiguration } from "./configuration.js";

export type TaxIntelligenceEngineVersion = "PILLOW-TX-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type EngineState = (typeof ENGINE_STATES)[number];
export type TaxStatus = (typeof TAX_STATUSES)[number];
export type TaxCategory = (typeof TAX_CATEGORIES)[number];
export type TxCapability = (typeof TX_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type TaxIntelligenceEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: EngineState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: TxCapability[];
  metadataVersion: string;
  frameworkModuleId: string | null;
  revenueEngineConnected: boolean;
  expenseEngineConnected: boolean;
  profitCalculationEngineConnected: boolean;
  reconciliationEngineConnected: boolean;
  invoiceGeneratorConnected: boolean;
  refundEngineConnected: boolean;
};

export type TaxRecord = {
  taxRecordId: string;
  timestamp: string;
  revenueReference: string | null;
  expenseReference: string | null;
  invoiceReference: string | null;
  refundReference: string | null;
  taxJurisdiction: string;
  taxCategory: TaxCategory;
  taxRate: number;
  taxAmount: number;
  taxStatus: TaxStatus;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type TaxAnomaly = {
  anomalyId: string;
  timestamp: string;
  severity: "low" | "medium" | "high";
  description: string;
  taxRecordId: string | null;
};

export type TaxSummary = {
  summaryId: string;
  timestamp: string;
  totalTaxLiability: number;
  totalTaxPaid: number;
  totalTaxObligation: number;
  byJurisdiction: Record<string, { liability: number; paid: number; obligation: number; count: number }>;
  byCategory: Record<string, { amount: number; count: number }>;
  recordCount: number;
  metadataVersion: string;
};

export type TaxValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type TaxIntelligenceRunReport = {
  taxRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "classify_transaction"
    | "calculate_liability"
    | "calculate_adjustment"
    | "record_tax_payment"
    | "generate_summary";
  engineRecord: TaxIntelligenceEngineRecord;
  taxRecords: TaxRecord[];
  anomalies: TaxAnomaly[];
  summary: TaxSummary | null;
  validation: TaxValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type TaxHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: TaxValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalTaxRecords: number;
  aggregateTaxAmount: number;
  lastTaxStatus: TaxStatus | null;
  notes: string[];
};

export type TaxPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  transactionsClassified: number;
  liabilitiesCalculated: number;
  adjustmentsCalculated: number;
  taxPaymentsRecorded: number;
  summariesGenerated: number;
  anomaliesDetected: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type TaxLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type TaxIntelligenceEngineState = {
  engineVersion: TaxIntelligenceEngineVersion;
  missionId: "R3-11";
  status: EngineStatus;
  initializedAt: string;
  configuration: TaxIntelligenceEngineConfiguration;
  latestReport: TaxIntelligenceRunReport | null;
  engineRecord: TaxIntelligenceEngineRecord | null;
  health: TaxHealthReport;
  performance: TaxPerformanceStats;
};

export type TaxCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: EngineState | null;
  lastDecision: TaxValidationReport["decision"] | null;
  totalTaxRecords: number;
  aggregateTaxAmount: number;
  lastTaxStatus: TaxStatus | null;
  frameworkRegistered: boolean;
  recentLogs: string[];
};

export type ConnectTaxIntelligenceEngineInput = {
  forceReconnect?: boolean;
};

export type ClassifyTaxableTransactionInput = {
  revenueReference?: string;
  expenseReference?: string;
  invoiceReference?: string;
  refundReference?: string;
  taxJurisdiction?: string;
};

export type CalculateTaxLiabilityInput = {
  revenueReference?: string;
  expenseReference?: string;
  invoiceReference?: string;
  taxableAmount: number;
  taxJurisdiction?: string;
  taxCategory?: TaxCategory;
};

export type CalculateTaxAdjustmentInput = {
  refundReference: string;
  taxJurisdiction?: string;
};

export type RecordTaxPaymentInput = {
  taxRecordId: string;
  paymentAmount: number;
};

export type GenerateTaxSummaryInput = {
  taxJurisdiction?: string;
};
