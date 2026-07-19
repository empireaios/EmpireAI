/** R3-17 — Export validation engine. */

import type { AccountingExportEngineConfiguration } from "./configuration.js";
import type { ExportRecord, ExportValidationReport } from "./types.js";
import { AEE_METADATA_VERSION } from "./paths.js";

export class ExportValidationEngine {
  validateExportRecord(
    record: ExportRecord,
    config: AccountingExportEngineConfiguration,
  ): ExportValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.exportRecordId.startsWith("aee-rec-")) {
      errors.push("Invalid export record ID prefix");
    }
    if (record.recordCount <= 0) {
      errors.push("Export contains no records");
    }
    if (record.exportStatus === "failed") {
      errors.push("Export status is failed");
    }

    const refTotal =
      record.revenueReferences.length +
      record.expenseReferences.length +
      record.invoiceReferences.length +
      record.refundReferences.length +
      record.taxReferences.length +
      record.reconciliationReferences.length;

    if (refTotal !== record.recordCount) {
      warnings.push("Reference count mismatch with record count");
    }

    if (config.validationRulesEnabled && record.validationStatus === "failed") {
      errors.push("Export validation status is failed");
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `aee-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: AEE_METADATA_VERSION,
    };
  }

  validatePackageContent(content: string, expectedRecordCount: number): ExportValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!content || content.trim().length === 0) {
      errors.push("Export package content is empty");
    }
    if (expectedRecordCount > 0 && content.split("\n").length < 2) {
      warnings.push("Export package appears truncated");
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `aee-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: AEE_METADATA_VERSION,
    };
  }
}
