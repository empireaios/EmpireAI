/** R3-17 — Export metadata generator. */

import {
  AEE_CAPABILITIES,
  AEE_METADATA_VERSION,
  ACCOUNTING_EXPORT_ENGINE_ID,
} from "./paths.js";
import type {
  AccountingExportEngineRecord,
  AccountingExportRunReport,
  EngineState,
  ExportFailure,
  ExportPackage,
  ExportRecord,
  ExportValidationReport,
  ValidationStatus,
} from "./types.js";

export function buildExportEngineRecordId(): string {
  return `aee-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildExportRunReportId(): string {
  return `aee-run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildExportRecordId(): string {
  return `aee-rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildExportFailureId(): string {
  return `aee-fail-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class ExportMetadataGenerator {
  buildEngineRecord(input: {
    frameworkModuleId: string | null;
    operationalState: EngineState;
    validationStatus: ValidationStatus;
    revenueEngineConnected: boolean;
    expenseEngineConnected: boolean;
    profitCalculationEngineConnected: boolean;
    reconciliationEngineConnected: boolean;
    invoiceGeneratorConnected: boolean;
    refundEngineConnected: boolean;
    taxIntelligenceEngineConnected: boolean;
  }): AccountingExportEngineRecord {
    const healthStatus =
      input.operationalState === "failed"
        ? "failed"
        : input.operationalState === "active"
          ? "healthy"
          : "degraded";

    return {
      engineRecordId: buildExportEngineRecordId(),
      timestamp: new Date().toISOString(),
      engineId: ACCOUNTING_EXPORT_ENGINE_ID,
      engineVersion: AEE_METADATA_VERSION,
      currentOperationalState: input.operationalState,
      healthStatus,
      validationStatus: input.validationStatus,
      supportedCapabilities: [...AEE_CAPABILITIES],
      metadataVersion: AEE_METADATA_VERSION,
      frameworkModuleId: input.frameworkModuleId,
      revenueEngineConnected: input.revenueEngineConnected,
      expenseEngineConnected: input.expenseEngineConnected,
      profitCalculationEngineConnected: input.profitCalculationEngineConnected,
      reconciliationEngineConnected: input.reconciliationEngineConnected,
      invoiceGeneratorConnected: input.invoiceGeneratorConnected,
      refundEngineConnected: input.refundEngineConnected,
      taxIntelligenceEngineConnected: input.taxIntelligenceEngineConnected,
    };
  }

  buildRunReport(input: {
    action: AccountingExportRunReport["action"];
    engineRecord: AccountingExportEngineRecord;
    exportRecords: ExportRecord[];
    packages: ExportPackage[];
    failures: ExportFailure[];
    validation: ExportValidationReport;
    durationMs: number;
  }): AccountingExportRunReport {
    return {
      exportRunReportId: buildExportRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      exportRecords: input.exportRecords,
      packages: input.packages,
      failures: input.failures,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: AEE_METADATA_VERSION,
    };
  }

  buildFailure(exportRecordId: string | null, reason: string, severity: ExportFailure["severity"]): ExportFailure {
    return {
      failureId: buildExportFailureId(),
      timestamp: new Date().toISOString(),
      exportRecordId,
      severity,
      reason,
      metadataVersion: AEE_METADATA_VERSION,
    };
  }
}
