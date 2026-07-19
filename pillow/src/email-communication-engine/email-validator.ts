/** R4-04 — Email validator. */

import { ECE_METADATA_VERSION } from "./paths.js";
import type { EmailCommunicationEngineConfiguration } from "./configuration.js";
import type { EmailEngineRecord, EmailValidationReport } from "./types.js";

export class EmailValidator {
  validateConfiguration(
    config: EmailCommunicationEngineConfiguration,
  ): EmailValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (config.maxRetryAttempts < 0) errors.push("maxRetryAttempts must be non-negative");

    const decision =
      errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `ece-val-cfg-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: ECE_METADATA_VERSION,
    };
  }

  validateEngineRecord(record: EmailEngineRecord): EmailValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.engineId) errors.push("Missing engine ID");
    if (!record.crmFoundationConnected) warnings.push("CRM Foundation not connected");
    if (!record.timelineEngineConnected) warnings.push("Customer Timeline Engine not connected");

    const decision =
      errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `ece-val-eng-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: ECE_METADATA_VERSION,
    };
  }
}
