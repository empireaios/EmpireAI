/** R4-14 — Customer Risk validator. */

import { CRE_METADATA_VERSION } from "./paths.js";
import type { CustomerRiskEngineConfiguration } from "./configuration.js";
import type {
  CustomerRiskEngineRecord,
  CustomerRiskRecord,
  CustomerRiskValidationReport,
} from "./types.js";

export class CustomerRiskValidator {
  validateConfiguration(config: CustomerRiskEngineConfiguration): CustomerRiskValidationReport {
    const started = Date.now();
    const errors: string[] = [];

    if (config.maxRetryAttempts < 0) errors.push("maxRetryAttempts must be non-negative");
    if (config.highRiskThreshold <= config.mediumRiskThreshold) {
      errors.push("highRiskThreshold must exceed mediumRiskThreshold");
    }
    if (config.criticalRiskThreshold <= config.highRiskThreshold) {
      errors.push("criticalRiskThreshold must exceed highRiskThreshold");
    }

    return {
      validationReportId: `cre-val-cfg-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: errors.length > 0 ? "fail" : "pass",
      errors,
      warnings: [],
      durationMs: Date.now() - started,
      metadataVersion: CRE_METADATA_VERSION,
    };
  }

  validateEngineRecord(record: CustomerRiskEngineRecord): CustomerRiskValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.engineId) errors.push("Missing engine ID");
    if (!record.identityEngineConnected) warnings.push("Customer Identity Engine not connected");
    if (!record.crmFoundationConnected) warnings.push("CRM Foundation not connected");

    const decision =
      errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `cre-val-eng-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: CRE_METADATA_VERSION,
    };
  }
}

export class CustomerRiskValidationEngine {
  validateCustomerRiskRecord(
    record: CustomerRiskRecord,
    config: CustomerRiskEngineConfiguration,
  ): CustomerRiskValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.customerId?.trim()) errors.push("Customer ID is required");
    if (record.riskScore < 0 || record.riskScore > 100) {
      errors.push("Risk score must be between 0 and 100");
    }
    if (!config.validationRulesEnabled) {
      warnings.push("Validation rules disabled — partial validation only");
    }

    const decision =
      errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `cre-val-rec-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: CRE_METADATA_VERSION,
    };
  }
}
