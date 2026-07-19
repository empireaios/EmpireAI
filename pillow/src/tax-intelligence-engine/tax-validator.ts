/** R3-11 — Tax validator and validation engine. */

import { TX_METADATA_VERSION } from "./paths.js";
import type { TaxIntelligenceEngineConfiguration } from "./configuration.js";
import type {
  TaxIntelligenceEngineRecord,
  TaxRecord,
  TaxValidationReport,
} from "./types.js";

export class TaxValidator {
  validateConfiguration(config: TaxIntelligenceEngineConfiguration): TaxValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.taxCalculationRulesEnabled) warnings.push("Tax calculation rules disabled");
    if (!config.jurisdictionRulesEnabled) warnings.push("Jurisdiction rules disabled");
    if (config.defaultTaxRate < 0 || config.defaultTaxRate > 1) {
      warnings.push("Default tax rate outside typical range");
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `tx-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: TX_METADATA_VERSION,
    };
  }

  validateEngineRecord(record: TaxIntelligenceEngineRecord): TaxValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.engineRecordId.startsWith("tx-")) {
      errors.push("Invalid engine record ID prefix");
    }
    if (!record.revenueEngineConnected) warnings.push("Revenue Engine not connected");
    if (!record.expenseEngineConnected) warnings.push("Expense Engine not connected");
    if (!record.invoiceGeneratorConnected) warnings.push("Invoice Generator not connected");

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `tx-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: TX_METADATA_VERSION,
    };
  }

  validateTaxRecord(record: TaxRecord): TaxValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.taxRecordId.startsWith("tx-rec-")) {
      errors.push("Invalid tax record ID prefix");
    }
    if (!record.taxJurisdiction) errors.push("Tax jurisdiction required");
    if (!record.revenueReference && !record.expenseReference && !record.invoiceReference && !record.refundReference) {
      warnings.push("No financial reference linked to tax record");
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `tx-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: TX_METADATA_VERSION,
    };
  }
}

export class TaxValidationEngine {
  constructor(private readonly validator: TaxValidator) {}

  validateForCalculation(
    record: TaxRecord,
    config: TaxIntelligenceEngineConfiguration,
  ): TaxValidationReport {
    const report = this.validator.validateTaxRecord(record);
    if (!config.validationRulesEnabled) {
      report.warnings.push("Validation rules disabled — partial acceptance");
      if (report.decision === "pass") report.decision = "partial";
    }
    return report;
  }
}
