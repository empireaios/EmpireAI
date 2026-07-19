/** R4-01 — Customer identity validator. */

import { CIE_METADATA_VERSION } from "./paths.js";
import type { CustomerIdentityEngineConfiguration } from "./configuration.js";
import type {
  CustomerIdentityEngineRecord,
  CustomerIdentityRecord,
  IdentityValidationReport,
} from "./types.js";

export class CustomerIdentityValidator {
  validateConfiguration(
    config: CustomerIdentityEngineConfiguration,
  ): IdentityValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (config.minMatchConfidenceScore < 0 || config.minMatchConfidenceScore > 100) {
      errors.push("minMatchConfidenceScore must be between 0 and 100");
    }
    if (config.maxRetryAttempts < 0) errors.push("maxRetryAttempts must be non-negative");
    if (config.connectionTimeoutMs < 1000) {
      warnings.push("connectionTimeoutMs below 1000ms may cause premature timeouts");
    }

    const decision =
      errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `cie-val-cfg-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: CIE_METADATA_VERSION,
    };
  }

  validateEngineRecord(
    record: CustomerIdentityEngineRecord,
  ): IdentityValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.engineId) errors.push("Missing engine ID");
    if (!record.engineRecordId) errors.push("Missing engine record ID");
    if (record.supportedCapabilities.length === 0) {
      warnings.push("No capabilities registered");
    }

    const decision =
      errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `cie-val-eng-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: CIE_METADATA_VERSION,
    };
  }

  validateCustomerRecord(
    record: CustomerIdentityRecord,
    config: CustomerIdentityEngineConfiguration,
  ): IdentityValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.customerId) errors.push("Missing customer ID");
    if (config.validationRulesEnabled && record.customerIdentifiers.length === 0) {
      warnings.push("No customer identifiers on record");
    }

    const decision =
      errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `cie-val-rec-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: CIE_METADATA_VERSION,
    };
  }
}
