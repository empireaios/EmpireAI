/** PILLOW-AEE-001 — Accounting Export Engine exports (R3-17). */

export {
  AccountingExportEngine,
  createAccountingExportEngine,
  resetAccountingExportEngineForTesting,
} from "./engine.js";

export {
  buildAccountingExportEngineConfiguration,
  DEFAULT_ACCOUNTING_EXPORT_ENGINE_CONFIGURATION,
  type AccountingExportEngineConfiguration,
  type ExportFormatRule,
  type ExportScopeRule,
} from "./configuration.js";

export {
  ACCOUNTING_EXPORT_ENGINE_SYSTEM_PATH,
  AEE_METADATA_VERSION,
  ACCOUNTING_EXPORT_ENGINE_ID,
  AEE_CAPABILITIES,
  EXPORT_FORMATS,
  EXPORT_SCOPES,
} from "./paths.js";

export type {
  AccountingExportEngineVersion,
  AccountingExportEngineRecord,
  ExportRecord,
  ExportPackage,
  ExportFailure,
  AccountingExportRunReport,
  AccountingExportEngineState,
  ExportCockpitSnapshot,
  ExportHealthReport,
  ExportPerformanceStats,
  ConnectAccountingExportEngineInput,
  ExportFinancialRecordsInput,
  ValidateExportInput,
  DetectExportFailuresInput,
  PackageExportInput,
  ExportFormat,
  ExportScope,
  EngineStatus,
  HealthStatus,
  ValidationStatus,
} from "./types.js";
