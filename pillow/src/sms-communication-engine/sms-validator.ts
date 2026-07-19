/** R4-05 — SMS validator. */

import { SCE_METADATA_VERSION } from "./paths.js";
import type { SmsCommunicationEngineConfiguration } from "./configuration.js";
import type { SmsEngineRecord, SmsValidationReport } from "./types.js";

export class SmsValidator {
  validateConfiguration(
    config: SmsCommunicationEngineConfiguration,
  ): SmsValidationReport {
    const started = Date.now();
    const errors: string[] = [];

    if (config.maxRetryAttempts < 0) errors.push("maxRetryAttempts must be non-negative");

    return {
      validationReportId: `sce-val-cfg-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: errors.length > 0 ? "fail" : "pass",
      errors,
      warnings: [],
      durationMs: Date.now() - started,
      metadataVersion: SCE_METADATA_VERSION,
    };
  }

  validateEngineRecord(record: SmsEngineRecord): SmsValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.engineId) errors.push("Missing engine ID");
    if (!record.crmFoundationConnected) warnings.push("CRM Foundation not connected");
    if (!record.timelineEngineConnected) warnings.push("Customer Timeline Engine not connected");

    const decision =
      errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `sce-val-eng-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: SCE_METADATA_VERSION,
    };
  }
}
