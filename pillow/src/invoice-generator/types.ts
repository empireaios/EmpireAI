/** PILLOW-IG-001 — Invoice Generator types (R3-09). */

import type {
  ENGINE_STATES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  IG_CAPABILITIES,
  INVOICE_STATUSES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { InvoiceGeneratorConfiguration } from "./configuration.js";

export type InvoiceGeneratorVersion = "PILLOW-IG-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type EngineState = (typeof ENGINE_STATES)[number];
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];
export type IgCapability = (typeof IG_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type InvoiceLineItem = {
  lineItemId: string;
  description: string;
  quantity: number;
  unitAmount: number;
  lineTotal: number;
  metadataVersion: string;
};

export type InvoiceGeneratorRecord = {
  generatorRecordId: string;
  timestamp: string;
  generatorId: string;
  generatorVersion: string;
  currentOperationalState: EngineState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: IgCapability[];
  metadataVersion: string;
  frameworkModuleId: string | null;
  revenueEngineConnected: boolean;
  expenseEngineConnected: boolean;
  reconciliationEngineConnected: boolean;
};

export type InvoiceRecord = {
  invoiceId: string;
  timestamp: string;
  invoiceNumber: string;
  customerReference: string | null;
  supplierReference: string | null;
  orderReference: string | null;
  revenueReference: string | null;
  expenseReference: string | null;
  invoiceAmount: number;
  currency: string;
  taxAmount: number;
  lineItems: InvoiceLineItem[];
  invoiceStatus: InvoiceStatus;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type InvoiceInconsistency = {
  inconsistencyId: string;
  timestamp: string;
  severity: "low" | "medium" | "high";
  description: string;
  invoiceId: string | null;
};

export type InvoiceValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type InvoiceGeneratorRunReport = {
  invoiceRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "create_customer_invoice"
    | "create_supplier_invoice"
    | "update_invoice_status";
  generatorRecord: InvoiceGeneratorRecord;
  invoiceRecords: InvoiceRecord[];
  inconsistencies: InvoiceInconsistency[];
  validation: InvoiceValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type InvoiceHealthReport = {
  status: HealthStatus;
  healthScore: number;
  generatorEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: InvoiceValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalInvoiceRecords: number;
  aggregateInvoiceAmount: number;
  lastInvoiceStatus: InvoiceStatus | null;
  notes: string[];
};

export type InvoicePerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  customerInvoicesCreated: number;
  supplierInvoicesCreated: number;
  lifecycleUpdates: number;
  inconsistenciesDetected: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type InvoiceLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type InvoiceGeneratorState = {
  engineVersion: InvoiceGeneratorVersion;
  missionId: "R3-09";
  status: EngineStatus;
  initializedAt: string;
  configuration: InvoiceGeneratorConfiguration;
  latestReport: InvoiceGeneratorRunReport | null;
  generatorRecord: InvoiceGeneratorRecord | null;
  health: InvoiceHealthReport;
  performance: InvoicePerformanceStats;
};

export type InvoiceCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: EngineState | null;
  lastDecision: InvoiceValidationReport["decision"] | null;
  totalInvoiceRecords: number;
  aggregateInvoiceAmount: number;
  lastInvoiceStatus: InvoiceStatus | null;
  frameworkRegistered: boolean;
  recentLogs: string[];
};

export type ConnectInvoiceGeneratorInput = {
  forceReconnect?: boolean;
};

export type CreateCustomerInvoiceInput = {
  revenueReference: string;
  customerReference?: string;
  orderReference?: string;
  currency?: string;
};

export type CreateSupplierInvoiceInput = {
  expenseReference: string;
  supplierReference?: string;
  currency?: string;
};

export type UpdateInvoiceStatusInput = {
  invoiceId: string;
  invoiceStatus: InvoiceStatus;
};
