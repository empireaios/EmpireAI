/** R3-12 — Currency validator and validation engine. */

import { MC_METADATA_VERSION } from "./paths.js";
import type { MultiCurrencyEngineConfiguration } from "./configuration.js";
import type {
  CurrencyRecord,
  CurrencyValidationReport,
  MultiCurrencyEngineRecord,
} from "./types.js";

export class CurrencyValidator {
  validateConfiguration(config: MultiCurrencyEngineConfiguration): CurrencyValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.conversionRulesEnabled) warnings.push("Conversion rules disabled");
    if (!config.supportedCurrencies.includes(config.reportingCurrency)) {
      warnings.push("Reporting currency not in supported currencies list");
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `mc-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: MC_METADATA_VERSION,
    };
  }

  validateEngineRecord(record: MultiCurrencyEngineRecord): CurrencyValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.engineRecordId.startsWith("mc-")) {
      errors.push("Invalid engine record ID prefix");
    }
    if (!record.revenueEngineConnected) warnings.push("Revenue Engine not connected");
    if (!record.expenseEngineConnected) warnings.push("Expense Engine not connected");

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `mc-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: MC_METADATA_VERSION,
    };
  }

  validateCurrencyRecord(record: CurrencyRecord): CurrencyValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.currencyRecordId.startsWith("mc-rec-")) {
      errors.push("Invalid currency record ID prefix");
    }
    if (!record.sourceCurrency || !record.targetCurrency) {
      errors.push("Source and target currency required");
    }
    if (record.originalAmount <= 0) errors.push("Original amount must be positive");
    if (record.exchangeRate <= 0 && record.sourceCurrency !== record.targetCurrency) {
      errors.push("Exchange rate must be positive");
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `mc-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: MC_METADATA_VERSION,
    };
  }
}

export class CurrencyValidationEngine {
  constructor(private readonly validator: CurrencyValidator) {}

  validateForConversion(
    record: CurrencyRecord,
    config: MultiCurrencyEngineConfiguration,
  ): CurrencyValidationReport {
    const report = this.validator.validateCurrencyRecord(record);
    if (!config.validationRulesEnabled) {
      report.warnings.push("Validation rules disabled — partial acceptance");
      if (report.decision === "pass") report.decision = "partial";
    }
    return report;
  }
}
