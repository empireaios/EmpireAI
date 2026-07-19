/** R3-04 — Revenue validator. */

import { RE_METADATA_VERSION } from "./paths.js";
import type { RevenueEngineConfiguration } from "./configuration.js";
import type {
  RevenueEngineRecord,
  RevenueRecord,
  RevenueValidationReport,
} from "./types.js";

export class RevenueValidator {
  validateConfiguration(config: RevenueEngineConfiguration): RevenueValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.classificationRulesEnabled) {
      warnings.push("Revenue classification rules disabled");
    }
    if (!config.aggregationRulesEnabled) {
      warnings.push("Revenue aggregation rules disabled");
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `re-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: RE_METADATA_VERSION,
    };
  }

  validateEngineRecord(record: RevenueEngineRecord): RevenueValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.engineRecordId.startsWith("re-")) {
      errors.push("Invalid engine record ID prefix");
    }
    if (!record.paymentGatewayConnected) {
      warnings.push("Payment Gateway Integration not connected");
    }
    if (!record.bankingIntegrationConnected) {
      warnings.push("Banking Integration not connected");
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `re-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: RE_METADATA_VERSION,
    };
  }

  validateRevenueRecord(record: RevenueRecord): RevenueValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.revenueRecordId.startsWith("re-rec-")) {
      errors.push("Invalid revenue record ID prefix");
    }
    if (record.grossRevenue < 0 && record.revenueSource !== "refund") {
      errors.push("Gross revenue cannot be negative for non-refund sources");
    }
    if (record.netRevenue > record.grossRevenue && record.revenueSource !== "refund") {
      warnings.push("Net revenue exceeds gross revenue");
    }
    if (!record.currency) errors.push("Missing currency");

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `re-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: RE_METADATA_VERSION,
    };
  }
}
