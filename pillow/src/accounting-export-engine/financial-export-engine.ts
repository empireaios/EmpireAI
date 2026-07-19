/** R3-17 — Financial export engine. */

import { AEE_METADATA_VERSION } from "./paths.js";
import type { AccountingFinancialSnapshot } from "./accounting-data-source.js";
import type { AccountingExportEngineConfiguration } from "./configuration.js";
import { buildExportRecordId } from "./export-metadata-generator.js";
import type { ExportFormat, ExportRecord, ExportScope, ValidationStatus } from "./types.js";

export class FinancialExportEngine {
  buildExportRecord(
    snapshot: AccountingFinancialSnapshot,
    config: AccountingExportEngineConfiguration,
    input: { exportFormat?: ExportFormat; exportScope?: ExportScope },
  ): ExportRecord {
    const exportFormat = input.exportFormat ?? config.defaultExportFormat;
    const exportScope = input.exportScope ?? config.defaultExportScope;

    const revenueReferences = snapshot.revenues.map((r) => r.revenueRecordId);
    const expenseReferences = snapshot.expenses.map((e) => e.expenseRecordId);
    const invoiceReferences = snapshot.invoices.map((i) => i.invoiceId);
    const refundReferences = snapshot.refunds.map((r) => r.refundId);
    const taxReferences = snapshot.taxes.map((t) => t.taxRecordId);
    const reconciliationReferences = snapshot.reconciliations.map(
      (r) => r.reconciliationRecordId,
    );

    const recordCount =
      revenueReferences.length +
      expenseReferences.length +
      invoiceReferences.length +
      refundReferences.length +
      taxReferences.length +
      reconciliationReferences.length;

    const validationStatus: ValidationStatus =
      recordCount === 0 ? "failed" : snapshot.warnings.length > 0 ? "partial" : "passed";

    const exportStatus =
      recordCount === 0 ? "failed" : snapshot.warnings.length > 0 ? "partial" : "completed";

    return {
      exportRecordId: buildExportRecordId(),
      timestamp: new Date().toISOString(),
      exportFormat,
      exportScope,
      revenueReferences,
      expenseReferences,
      invoiceReferences,
      refundReferences,
      taxReferences,
      reconciliationReferences,
      exportStatus,
      validationStatus,
      metadataVersion: AEE_METADATA_VERSION,
      recordCount,
      packageRef: null,
    };
  }
}
