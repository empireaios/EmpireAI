/** R3-11 — Tax metadata generator. */

import {
  TAX_INTELLIGENCE_ENGINE_ID,
  TX_CAPABILITIES,
  TX_METADATA_VERSION,
} from "./paths.js";
import type {
  EngineState,
  TaxAnomaly,
  TaxIntelligenceEngineRecord,
  TaxIntelligenceRunReport,
  TaxRecord,
  TaxSummary,
  TaxValidationReport,
  TaxCategory,
  TaxStatus,
  ValidationStatus,
} from "./types.js";

export function buildTaxEngineRecordId(): string {
  return `tx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildTaxRunReportId(): string {
  return `tx-run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildTaxRecordId(): string {
  return `tx-rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class TaxMetadataGenerator {
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
  }): TaxIntelligenceEngineRecord {
    const healthStatus =
      input.operationalState === "failed"
        ? "failed"
        : input.operationalState === "active"
          ? "healthy"
          : "degraded";

    return {
      engineRecordId: buildTaxEngineRecordId(),
      timestamp: new Date().toISOString(),
      engineId: TAX_INTELLIGENCE_ENGINE_ID,
      engineVersion: TX_METADATA_VERSION,
      currentOperationalState: input.operationalState,
      healthStatus,
      validationStatus: input.validationStatus,
      supportedCapabilities: [...TX_CAPABILITIES],
      metadataVersion: TX_METADATA_VERSION,
      frameworkModuleId: input.frameworkModuleId,
      revenueEngineConnected: input.revenueEngineConnected,
      expenseEngineConnected: input.expenseEngineConnected,
      profitCalculationEngineConnected: input.profitCalculationEngineConnected,
      reconciliationEngineConnected: input.reconciliationEngineConnected,
      invoiceGeneratorConnected: input.invoiceGeneratorConnected,
      refundEngineConnected: input.refundEngineConnected,
    };
  }

  buildTaxRecord(input: {
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
  }): TaxRecord {
    return {
      taxRecordId: buildTaxRecordId(),
      timestamp: new Date().toISOString(),
      revenueReference: input.revenueReference,
      expenseReference: input.expenseReference,
      invoiceReference: input.invoiceReference,
      refundReference: input.refundReference,
      taxJurisdiction: input.taxJurisdiction,
      taxCategory: input.taxCategory,
      taxRate: input.taxRate,
      taxAmount: input.taxAmount,
      taxStatus: input.taxStatus,
      validationStatus: input.validationStatus,
      metadataVersion: TX_METADATA_VERSION,
    };
  }

  buildRunReport(input: {
    action: TaxIntelligenceRunReport["action"];
    engineRecord: TaxIntelligenceEngineRecord;
    taxRecords: TaxRecord[];
    anomalies: TaxAnomaly[];
    summary: TaxSummary | null;
    validation: TaxValidationReport;
    durationMs: number;
  }): TaxIntelligenceRunReport {
    return {
      taxRunReportId: buildTaxRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      taxRecords: input.taxRecords,
      anomalies: input.anomalies,
      summary: input.summary,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: TX_METADATA_VERSION,
    };
  }
}
