/** PILLOW-AEE-001 — Accounting Export Engine types (R3-17). */

import type {
  AEE_CAPABILITIES,
  ENGINE_STATES,
  ENGINE_STATUSES,
  EXPORT_FORMATS,
  EXPORT_SCOPES,
  EXPORT_STATUSES,
  HEALTH_STATUSES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { AccountingExportEngineConfiguration } from "./configuration.js";

export type AccountingExportEngineVersion = "PILLOW-AEE-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type EngineState = (typeof ENGINE_STATES)[number];
export type ExportFormat = (typeof EXPORT_FORMATS)[number];
export type ExportScope = (typeof EXPORT_SCOPES)[number];
export type ExportStatus = (typeof EXPORT_STATUSES)[number];
export type AeeCapability = (typeof AEE_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type AccountingExportEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: EngineState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: AeeCapability[];
  metadataVersion: string;
  frameworkModuleId: string | null;
  revenueEngineConnected: boolean;
  expenseEngineConnected: boolean;
  profitCalculationEngineConnected: boolean;
  reconciliationEngineConnected: boolean;
  invoiceGeneratorConnected: boolean;
  refundEngineConnected: boolean;
  taxIntelligenceEngineConnected: boolean;
};

export type ExportRecord = {
  exportRecordId: string;
  timestamp: string;
  exportFormat: ExportFormat;
  exportScope: ExportScope;
  revenueReferences: string[];
  expenseReferences: string[];
  invoiceReferences: string[];
  refundReferences: string[];
  taxReferences: string[];
  reconciliationReferences: string[];
  exportStatus: ExportStatus;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  recordCount: number;
  packageRef: string | null;
};

export type ExportPackage = {
  packageId: string;
  exportRecordId: string;
  exportFormat: ExportFormat;
  content: string;
  checksum: string;
  recordCount: number;
  timestamp: string;
  metadataVersion: string;
};

export type ExportFailure = {
  failureId: string;
  timestamp: string;
  exportRecordId: string | null;
  severity: "low" | "medium" | "high";
  reason: string;
  metadataVersion: string;
};

export type ExportValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type AccountingExportRunReport = {
  exportRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "export_records"
    | "validate_export"
    | "detect_failures"
    | "package_export";
  engineRecord: AccountingExportEngineRecord;
  exportRecords: ExportRecord[];
  packages: ExportPackage[];
  failures: ExportFailure[];
  validation: ExportValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type ExportHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: ExportValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalExportRecords: number;
  lastExportFormat: ExportFormat | null;
  lastExportStatus: ExportStatus | null;
  notes: string[];
};

export type ExportPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  exportsGenerated: number;
  exportsValidated: number;
  failuresDetected: number;
  packagesCreated: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type ExportCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: EngineState | null;
  lastDecision: ExportValidationReport["decision"] | null;
  totalExportRecords: number;
  lastExportFormat: ExportFormat | null;
  frameworkRegistered: boolean;
  recentLogs: string[];
};

export type AeeLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "debug" | "info" | "warn" | "error";
  details: string;
};

export type ConnectAccountingExportEngineInput = {
  forceReconnect?: boolean;
};

export type ExportFinancialRecordsInput = {
  exportFormat?: ExportFormat;
  exportScope?: ExportScope;
  forceExport?: boolean;
};

export type ValidateExportInput = {
  exportRecordId?: string;
};

export type DetectExportFailuresInput = {
  exportRecordId?: string;
};

export type PackageExportInput = {
  exportRecordId?: string;
  exportFormat?: ExportFormat;
};

export type AccountingExportEngineState = {
  engineVersion: AccountingExportEngineVersion;
  missionId: "R3-17";
  status: EngineStatus;
  initializedAt: string;
  configuration: AccountingExportEngineConfiguration;
  latestReport: AccountingExportRunReport | null;
  engineRecord: AccountingExportEngineRecord | null;
  health: ExportHealthReport;
  performance: ExportPerformanceStats;
};
