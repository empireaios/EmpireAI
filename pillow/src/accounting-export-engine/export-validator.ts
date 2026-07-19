/** R3-17 — Export validator. */

import { AEE_METADATA_VERSION, EXPORT_FORMATS, EXPORT_SCOPES } from "./paths.js";
import type { AccountingExportEngineConfiguration } from "./configuration.js";
import type {
  AccountingExportEngineRecord,
  ExportRecord,
  ExportValidationReport,
} from "./types.js";

export class ExportValidator {
  validateConfiguration(config: AccountingExportEngineConfiguration): ExportValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.exportFormatRulesEnabled) warnings.push("Export format rules disabled");
    if (!config.exportSchedulingRulesEnabled) warnings.push("Export scheduling rules disabled");
    if (config.exportFrequencyMs < 1000) warnings.push("Export frequency very low");

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

  validateEngineRecord(record: AccountingExportEngineRecord): ExportValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.engineRecordId.startsWith("aee-")) {
      errors.push("Invalid engine record ID prefix");
    }
    if (!record.revenueEngineConnected) warnings.push("Revenue Engine not connected");
    if (!record.expenseEngineConnected) warnings.push("Expense Engine not connected");
    if (!record.invoiceGeneratorConnected) warnings.push("Invoice Generator not connected");

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

  validateExportRequest(
    format: string,
    scope: string,
    config: AccountingExportEngineConfiguration,
  ): ExportValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!(EXPORT_FORMATS as readonly string[]).includes(format)) {
      errors.push("Invalid export format");
    }
    if (!(EXPORT_SCOPES as readonly string[]).includes(scope)) {
      errors.push("Invalid export scope");
    }
    if (config.exportFormatRulesEnabled) {
      const rule = config.formatRules.find((r) => r.format === format);
      if (rule && !rule.enabled) errors.push(`Export format ${format} is disabled`);
    }
    if (config.exportSchedulingRulesEnabled) {
      const rule = config.scopeRules.find((r) => r.scope === scope);
      if (rule && !rule.enabled) errors.push(`Export scope ${scope} is disabled`);
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
    if (record.recordCount <= 0 && config.validationRulesEnabled) {
      errors.push("Export contains no records");
    }
    if (record.exportStatus === "failed") {
      errors.push("Export status is failed");
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
