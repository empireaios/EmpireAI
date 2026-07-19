/** R4-08 — Support validator. */

import { ACS_METADATA_VERSION } from "./paths.js";
import type { AiCustomerSupportConfiguration } from "./configuration.js";
import type { AiSupportEngineRecord, AiSupportValidationReport } from "./types.js";

export class SupportValidator {
  validateConfiguration(
    config: AiCustomerSupportConfiguration,
  ): AiSupportValidationReport {
    const started = Date.now();
    const errors: string[] = [];

    if (config.maxRetryAttempts < 0) errors.push("maxRetryAttempts must be non-negative");

    return {
      validationReportId: `acs-val-cfg-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: errors.length > 0 ? "fail" : "pass",
      errors,
      warnings: [],
      durationMs: Date.now() - started,
      metadataVersion: ACS_METADATA_VERSION,
    };
  }

  validateEngineRecord(record: AiSupportEngineRecord): AiSupportValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.engineId) errors.push("Missing engine ID");
    if (!record.timelineEngineConnected) warnings.push("Customer Timeline Engine not connected");
    if (!record.crmFoundationConnected) warnings.push("CRM Foundation not connected");

    const decision =
      errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `acs-val-eng-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: ACS_METADATA_VERSION,
    };
  }
}
