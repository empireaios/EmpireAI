/** R4-15 — CLV validator. */

import { CLVE_METADATA_VERSION } from "./paths.js";
import type { CustomerLifetimeValueEngineConfiguration } from "./configuration.js";
import type { ClvEngineRecord, ClvRecord, ClvValidationReport } from "./types.js";

export class ClvValidator {
  validateConfiguration(
    config: CustomerLifetimeValueEngineConfiguration,
  ): ClvValidationReport {
    const started = Date.now();
    const errors: string[] = [];

    if (config.maxRetryAttempts < 0) errors.push("maxRetryAttempts must be non-negative");
    if (config.highValueThreshold < 0) errors.push("highValueThreshold must be non-negative");
    if (config.defaultProfitMargin < 0 || config.defaultProfitMargin > 1) {
      errors.push("defaultProfitMargin must be between 0 and 1");
    }
    if (config.decliningValueDropPercent < 0 || config.decliningValueDropPercent > 100) {
      errors.push("decliningValueDropPercent must be between 0 and 100");
    }

    return {
      validationReportId: `clve-val-cfg-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: errors.length > 0 ? "fail" : "pass",
      errors,
      warnings: [],
      durationMs: Date.now() - started,
      metadataVersion: CLVE_METADATA_VERSION,
    };
  }

  validateEngineRecord(record: ClvEngineRecord): ClvValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.engineId) errors.push("Missing engine ID");
    if (!record.identityEngineConnected) warnings.push("Customer Identity Engine not connected");
    if (!record.revenueEngineConnected) warnings.push("Revenue Engine not connected");

    const decision =
      errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `clve-val-eng-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: CLVE_METADATA_VERSION,
    };
  }
}

export class ClvValidationEngine {
  validateClvRecord(
    record: ClvRecord,
    config: CustomerLifetimeValueEngineConfiguration,
  ): ClvValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.customerId?.trim()) errors.push("Customer ID is required");
    if (record.revenueContribution < 0) errors.push("Revenue contribution must be non-negative");
    if (record.profitContribution < 0) errors.push("Profit contribution must be non-negative");
    if (record.purchaseFrequency < 0) errors.push("Purchase frequency must be non-negative");
    if (record.averageOrderValue < 0) errors.push("Average order value must be non-negative");
    if (record.retentionScore < 0 || record.retentionScore > 100) {
      errors.push("Retention score must be between 0 and 100");
    }
    if (record.lifetimeValue < 0) errors.push("Lifetime value must be non-negative");
    if (record.predictedLifetimeValue < 0) {
      errors.push("Predicted lifetime value must be non-negative");
    }
    if (!config.validationRulesEnabled) {
      warnings.push("Validation rules disabled — partial validation only");
    }

    const decision =
      errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `clve-val-rec-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: CLVE_METADATA_VERSION,
    };
  }
}
