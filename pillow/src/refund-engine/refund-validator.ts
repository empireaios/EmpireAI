/** R3-10 — Refund validator and validation engine. */

import { RF_METADATA_VERSION } from "./paths.js";
import type { RefundEngineConfiguration } from "./configuration.js";
import type {
  RefundEngineRecord,
  RefundRecord,
  RefundValidationReport,
} from "./types.js";

export class RefundValidator {
  validateConfiguration(config: RefundEngineConfiguration): RefundValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.eligibilityRulesEnabled) warnings.push("Eligibility rules disabled");
    if (!config.partialRefundRulesEnabled) warnings.push("Partial refund rules disabled");
    if (config.maxPartialRefundRatio <= 0 || config.maxPartialRefundRatio > 1) {
      warnings.push("Partial refund ratio outside typical range");
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `rf-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: RF_METADATA_VERSION,
    };
  }

  validateEngineRecord(record: RefundEngineRecord): RefundValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.engineRecordId.startsWith("rf-")) {
      errors.push("Invalid engine record ID prefix");
    }
    if (!record.paymentGatewayConnected) warnings.push("Payment Gateway not connected");
    if (!record.bankingIntegrationConnected) warnings.push("Banking Integration not connected");
    if (!record.revenueEngineConnected) warnings.push("Revenue Engine not connected");
    if (!record.invoiceGeneratorConnected) warnings.push("Invoice Generator not connected");

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `rf-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: RF_METADATA_VERSION,
    };
  }

  validateRefundRecord(record: RefundRecord): RefundValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.refundId.startsWith("rf-rec-")) {
      errors.push("Invalid refund record ID prefix");
    }
    if (!record.paymentReference) errors.push("Payment reference required");
    if (record.refundAmount <= 0) errors.push("Refund amount must be positive");
    if (!record.refundReason) warnings.push("Refund reason not provided");

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `rf-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: RF_METADATA_VERSION,
    };
  }
}

export class RefundValidationEngineWrapper {
  constructor(private readonly validator: RefundValidator) {}

  validateForProcessing(
    record: RefundRecord,
    config: RefundEngineConfiguration,
  ): RefundValidationReport {
    const report = this.validator.validateRefundRecord(record);
    if (!config.validationRulesEnabled) {
      report.warnings.push("Validation rules disabled — partial acceptance");
      if (report.decision === "pass") report.decision = "partial";
    }
    return report;
  }
}
