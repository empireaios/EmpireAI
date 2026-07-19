/** R3-09 — Invoice validator and validation engine. */

import { IG_METADATA_VERSION } from "./paths.js";
import type { InvoiceGeneratorConfiguration } from "./configuration.js";
import type {
  InvoiceGeneratorRecord,
  InvoiceRecord,
  InvoiceValidationReport,
} from "./types.js";

export class InvoiceValidator {
  validateConfiguration(config: InvoiceGeneratorConfiguration): InvoiceValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.invoiceNumberingRulesEnabled) warnings.push("Invoice numbering rules disabled");
    if (config.defaultTaxRate < 0 || config.defaultTaxRate > 1) {
      warnings.push("Tax rate outside typical range");
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `inv-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: IG_METADATA_VERSION,
    };
  }

  validateGeneratorRecord(record: InvoiceGeneratorRecord): InvoiceValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.generatorRecordId.startsWith("inv-")) {
      errors.push("Invalid generator record ID prefix");
    }
    if (!record.revenueEngineConnected) warnings.push("Revenue Engine not connected");
    if (!record.expenseEngineConnected) warnings.push("Expense Engine not connected");
    if (!record.reconciliationEngineConnected) warnings.push("Reconciliation Engine not connected");

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `inv-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: IG_METADATA_VERSION,
    };
  }

  validateInvoiceRecord(record: InvoiceRecord): InvoiceValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.invoiceId.startsWith("inv-rec-")) {
      errors.push("Invalid invoice record ID prefix");
    }
    if (!record.invoiceNumber) errors.push("Invoice number required");
    if (record.invoiceAmount < 0) errors.push("Invoice amount must be non-negative");
    if (!record.customerReference && !record.supplierReference) {
      warnings.push("Neither customer nor supplier reference present");
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `inv-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: IG_METADATA_VERSION,
    };
  }
}

export class InvoiceValidationEngine {
  constructor(private readonly validator: InvoiceValidator) {}

  validateForGeneration(
    record: InvoiceRecord,
    config: InvoiceGeneratorConfiguration,
  ): InvoiceValidationReport {
    const report = this.validator.validateInvoiceRecord(record);
    if (!config.validationRulesEnabled) {
      report.warnings.push("Validation rules disabled — partial acceptance");
      if (report.decision === "pass") report.decision = "partial";
    }
    return report;
  }
}
