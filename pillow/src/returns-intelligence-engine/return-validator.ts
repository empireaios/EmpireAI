/** R4-13 — Return validator. */

import { RIE_METADATA_VERSION } from "./paths.js";
import type { ReturnsIntelligenceEngineConfiguration } from "./configuration.js";
import type {
  ReturnIntelligenceRecord,
  ReturnIntelligenceValidationReport,
  ReturnsIntelligenceEngineRecord,
} from "./types.js";

export class ReturnValidator {
  validateConfiguration(
    config: ReturnsIntelligenceEngineConfiguration,
  ): ReturnIntelligenceValidationReport {
    const started = Date.now();
    const errors: string[] = [];

    if (config.maxRetryAttempts < 0) errors.push("maxRetryAttempts must be non-negative");
    if (config.highRiskThreshold <= config.mediumRiskThreshold) {
      errors.push("highRiskThreshold must exceed mediumRiskThreshold");
    }

    return {
      validationReportId: `rie-val-cfg-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: errors.length > 0 ? "fail" : "pass",
      errors,
      warnings: [],
      durationMs: Date.now() - started,
      metadataVersion: RIE_METADATA_VERSION,
    };
  }

  validateEngineRecord(record: ReturnsIntelligenceEngineRecord): ReturnIntelligenceValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.engineId) errors.push("Missing engine ID");
    if (!record.identityEngineConnected) warnings.push("Customer Identity Engine not connected");
    if (!record.crmFoundationConnected) warnings.push("CRM Foundation not connected");
    if (!record.returnManagementEngineConnected) {
      warnings.push("Return Management Engine not connected");
    }

    const decision =
      errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `rie-val-eng-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: RIE_METADATA_VERSION,
    };
  }
}

export class ReturnValidationEngine {
  validateReturnIntelligenceRecord(
    record: ReturnIntelligenceRecord,
    config: ReturnsIntelligenceEngineConfiguration,
  ): ReturnIntelligenceValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.customerId?.trim()) errors.push("Customer ID is required");
    if (!record.orderReference?.trim()) errors.push("Order reference is required");
    if (!record.returnReference?.trim()) errors.push("Return reference is required");
    if (record.returnRiskScore < 0 || record.returnRiskScore > 100) {
      errors.push("Return risk score must be between 0 and 100");
    }
    if (!config.validationRulesEnabled) {
      warnings.push("Validation rules disabled — partial validation only");
    }

    const decision =
      errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `rie-val-rec-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: RIE_METADATA_VERSION,
    };
  }
}
