/** R3-09 — Invoice metadata generator. */

import {
  IG_CAPABILITIES,
  IG_METADATA_VERSION,
  INVOICE_GENERATOR_ID,
} from "./paths.js";
import type {
  EngineState,
  InvoiceGeneratorRecord,
  InvoiceGeneratorRunReport,
  InvoiceInconsistency,
  InvoiceLineItem,
  InvoiceRecord,
  InvoiceStatus,
  InvoiceValidationReport,
  ValidationStatus,
} from "./types.js";

export function buildGeneratorRecordId(): string {
  return `inv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildInvoiceRunReportId(): string {
  return `inv-run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildInvoiceRecordId(): string {
  return `inv-rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class InvoiceMetadataGenerator {
  buildGeneratorRecord(input: {
    frameworkModuleId: string | null;
    operationalState: EngineState;
    validationStatus: ValidationStatus;
    revenueEngineConnected: boolean;
    expenseEngineConnected: boolean;
    reconciliationEngineConnected: boolean;
  }): InvoiceGeneratorRecord {
    const healthStatus =
      input.operationalState === "failed"
        ? "failed"
        : input.operationalState === "active"
          ? "healthy"
          : "degraded";

    return {
      generatorRecordId: buildGeneratorRecordId(),
      timestamp: new Date().toISOString(),
      generatorId: INVOICE_GENERATOR_ID,
      generatorVersion: IG_METADATA_VERSION,
      currentOperationalState: input.operationalState,
      healthStatus,
      validationStatus: input.validationStatus,
      supportedCapabilities: [...IG_CAPABILITIES],
      metadataVersion: IG_METADATA_VERSION,
      frameworkModuleId: input.frameworkModuleId,
      revenueEngineConnected: input.revenueEngineConnected,
      expenseEngineConnected: input.expenseEngineConnected,
      reconciliationEngineConnected: input.reconciliationEngineConnected,
    };
  }

  buildInvoiceRecord(input: {
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
  }): InvoiceRecord {
    return {
      invoiceId: buildInvoiceRecordId(),
      timestamp: new Date().toISOString(),
      invoiceNumber: input.invoiceNumber,
      customerReference: input.customerReference,
      supplierReference: input.supplierReference,
      orderReference: input.orderReference,
      revenueReference: input.revenueReference,
      expenseReference: input.expenseReference,
      invoiceAmount: input.invoiceAmount,
      currency: input.currency,
      taxAmount: input.taxAmount,
      lineItems: input.lineItems,
      invoiceStatus: input.invoiceStatus,
      validationStatus: input.validationStatus,
      metadataVersion: IG_METADATA_VERSION,
    };
  }

  buildRunReport(input: {
    action: InvoiceGeneratorRunReport["action"];
    generatorRecord: InvoiceGeneratorRecord;
    invoiceRecords: InvoiceRecord[];
    inconsistencies: InvoiceInconsistency[];
    validation: InvoiceValidationReport;
    durationMs: number;
  }): InvoiceGeneratorRunReport {
    return {
      invoiceRunReportId: buildInvoiceRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      generatorRecord: input.generatorRecord,
      invoiceRecords: input.invoiceRecords,
      inconsistencies: input.inconsistencies,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: IG_METADATA_VERSION,
    };
  }
}
