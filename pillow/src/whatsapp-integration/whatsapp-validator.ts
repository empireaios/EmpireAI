/** R4-06 — WhatsApp validator. */

import { WAI_METADATA_VERSION } from "./paths.js";
import type { WhatsAppIntegrationConfiguration } from "./configuration.js";
import type { WhatsAppEngineRecord, WhatsAppValidationReport } from "./types.js";

export class WhatsAppValidator {
  validateConfiguration(
    config: WhatsAppIntegrationConfiguration,
  ): WhatsAppValidationReport {
    const started = Date.now();
    const errors: string[] = [];

    if (config.maxRetryAttempts < 0) errors.push("maxRetryAttempts must be non-negative");

    return {
      validationReportId: `wai-val-cfg-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: errors.length > 0 ? "fail" : "pass",
      errors,
      warnings: [],
      durationMs: Date.now() - started,
      metadataVersion: WAI_METADATA_VERSION,
    };
  }

  validateEngineRecord(record: WhatsAppEngineRecord): WhatsAppValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.engineId) errors.push("Missing engine ID");
    if (!record.crmFoundationConnected) warnings.push("CRM Foundation not connected");
    if (!record.timelineEngineConnected) warnings.push("Customer Timeline Engine not connected");

    const decision =
      errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `wai-val-eng-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: WAI_METADATA_VERSION,
    };
  }
}
