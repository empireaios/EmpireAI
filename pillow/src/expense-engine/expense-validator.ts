/** R3-05 — Expense validator. */

import { EX_METADATA_VERSION } from "./paths.js";
import type { ExpenseEngineConfiguration } from "./configuration.js";
import type {
  ExpenseEngineRecord,
  ExpenseRecord,
  ExpenseValidationReport,
} from "./types.js";

export class ExpenseValidator {
  validateConfiguration(config: ExpenseEngineConfiguration): ExpenseValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.classificationRulesEnabled) {
      warnings.push("Expense classification rules disabled");
    }
    if (!config.aggregationRulesEnabled) {
      warnings.push("Expense aggregation rules disabled");
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `ex-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: EX_METADATA_VERSION,
    };
  }

  validateEngineRecord(record: ExpenseEngineRecord): ExpenseValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.engineRecordId.startsWith("ex-")) {
      errors.push("Invalid engine record ID prefix");
    }
    if (!record.paymentGatewayConnected) {
      warnings.push("Payment Gateway Integration not connected");
    }
    if (!record.bankingIntegrationConnected) {
      warnings.push("Banking Integration not connected");
    }
    if (!record.revenueEngineConnected) {
      warnings.push("Revenue Engine not connected");
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `ex-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: EX_METADATA_VERSION,
    };
  }

  validateExpenseRecord(record: ExpenseRecord): ExpenseValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.expenseRecordId.startsWith("ex-rec-")) {
      errors.push("Invalid expense record ID prefix");
    }
    if (record.expenseAmount < 0) {
      errors.push("Expense amount cannot be negative");
    }
    if (!record.currency) errors.push("Missing currency");
    if (!record.expenseCategory) errors.push("Missing expense category");

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `ex-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: EX_METADATA_VERSION,
    };
  }
}

/** R3-05 — Expense validation engine (validation orchestration). */
export class ExpenseValidationEngine {
  constructor(private readonly validator: ExpenseValidator) {}

  validateForRecording(
    record: ExpenseRecord,
    config: ExpenseEngineConfiguration,
  ): ExpenseValidationReport {
    if (!config.validationRulesEnabled) {
      return {
        validationReportId: `ex-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "pass",
        errors: [],
        warnings: ["Validation rules disabled"],
        durationMs: 0,
        metadataVersion: EX_METADATA_VERSION,
      };
    }
    return this.validator.validateExpenseRecord(record);
  }
}
