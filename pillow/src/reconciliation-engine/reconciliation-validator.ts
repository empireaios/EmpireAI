/** R3-08 — Reconciliation validator and validation engine. */

import { RC_METADATA_VERSION } from "./paths.js";
import type { ReconciliationEngineConfiguration } from "./configuration.js";
import type {
  ReconciliationEngineRecord,
  ReconciliationRecord,
  ReconciliationValidationReport,
} from "./types.js";

export class ReconciliationValidator {
  validateConfiguration(config: ReconciliationEngineConfiguration): ReconciliationValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.matchingRulesEnabled) warnings.push("Matching rules disabled");
    if (!Number.isFinite(config.amountTolerance) || config.amountTolerance < 0) errors.push("Amount tolerance must be non-negative");
    if (!Number.isFinite(config.differenceThreshold) || config.differenceThreshold < 0) errors.push("Difference threshold must be non-negative");

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `rc-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: RC_METADATA_VERSION,
    };
  }

  validateEngineRecord(record: ReconciliationEngineRecord): ReconciliationValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.engineRecordId.startsWith("rc-")) {
      errors.push("Invalid engine record ID prefix");
    }
    if (!record.paymentGatewayConnected) warnings.push("Payment Gateway not connected");
    if (!record.bankingIntegrationConnected) warnings.push("Banking Integration not connected");
    if (!record.revenueEngineConnected) warnings.push("Revenue Engine not connected");
    if (!record.expenseEngineConnected) warnings.push("Expense Engine not connected");
    if (!record.cashFlowMonitorConnected) warnings.push("Cash Flow Monitor not connected");

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `rc-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: RC_METADATA_VERSION,
    };
  }

  validateReconciliationRecord(record: ReconciliationRecord): ReconciliationValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.reconciliationRecordId.startsWith("rc-rec-")) {
      errors.push("Invalid reconciliation record ID prefix");
    }
    if (![record.matchedTransactionCount,record.unmatchedTransactionCount].every(value=>Number.isSafeInteger(value)&&value>=0)) {
      errors.push("Transaction counts must be non-negative safe integers");
    }
    if(!Number.isFinite(record.differenceAmount)||record.differenceAmount<0)errors.push("Difference must be finite and non-negative");
    if(record.reconciliationStatus==="matched"&&(record.matchedTransactionCount===0||record.unmatchedTransactionCount!==0||record.differenceAmount!==0))
      errors.push("Matched status requires positive matched evidence with no unmatched records or unexplained variance");

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `rc-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: RC_METADATA_VERSION,
    };
  }
}

export class ReconciliationValidationEngine {
  constructor(private readonly validator: ReconciliationValidator) {}

  validateForReconciliation(
    record: ReconciliationRecord,
    config: ReconciliationEngineConfiguration,
  ): ReconciliationValidationReport {
    const report = this.validator.validateReconciliationRecord(record);
    if (!config.validationRulesEnabled) {
      report.warnings.push("Validation rules disabled — partial acceptance");
      if (report.decision === "pass") report.decision = "partial";
    }
    if (record.reconciliationStatus === "mismatched") {
      report.warnings.push("Reconciliation status is mismatched");
      if (report.decision === "pass") report.decision = "partial";
    }
    return report;
  }
}
