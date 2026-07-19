/** R4-02 — CRM validator. */

import { CRM_METADATA_VERSION } from "./paths.js";
import type { CrmFoundationConfiguration } from "./configuration.js";
import type { CrmEngineRecord, CrmRecord, CrmValidationReport } from "./types.js";

export class CrmValidator {
  validateConfiguration(config: CrmFoundationConfiguration): CrmValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (config.maxRetryAttempts < 0) errors.push("maxRetryAttempts must be non-negative");
    if (config.defaultSearchLimit < 1) errors.push("defaultSearchLimit must be at least 1");
    if (config.connectionTimeoutMs < 1000) {
      warnings.push("connectionTimeoutMs below 1000ms may cause premature timeouts");
    }

    const decision =
      errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `crm-val-cfg-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: CRM_METADATA_VERSION,
    };
  }

  validateEngineRecord(record: CrmEngineRecord): CrmValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.engineId) errors.push("Missing engine ID");
    if (!record.identityEngineConnected) {
      warnings.push("Customer Identity Engine not connected");
    }

    const decision =
      errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `crm-val-eng-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: CRM_METADATA_VERSION,
    };
  }

  validateCrmRecord(record: CrmRecord): CrmValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.crmRecordId) errors.push("Missing CRM record ID");
    if (!record.customerId) errors.push("Missing customer ID");

    const decision =
      errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `crm-val-rec-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: CRM_METADATA_VERSION,
    };
  }
}
