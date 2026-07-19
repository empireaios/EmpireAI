/** R4-07 — Chat validator. */

import { LCI_METADATA_VERSION } from "./paths.js";
import type { LiveChatIntegrationConfiguration } from "./configuration.js";
import type { LiveChatEngineRecord, LiveChatValidationReport } from "./types.js";

export class ChatValidator {
  validateConfiguration(
    config: LiveChatIntegrationConfiguration,
  ): LiveChatValidationReport {
    const started = Date.now();
    const errors: string[] = [];

    if (config.maxRetryAttempts < 0) errors.push("maxRetryAttempts must be non-negative");

    return {
      validationReportId: `lci-val-cfg-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: errors.length > 0 ? "fail" : "pass",
      errors,
      warnings: [],
      durationMs: Date.now() - started,
      metadataVersion: LCI_METADATA_VERSION,
    };
  }

  validateEngineRecord(record: LiveChatEngineRecord): LiveChatValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.engineId) errors.push("Missing engine ID");
    if (!record.timelineEngineConnected) warnings.push("Customer Timeline Engine not connected");

    const decision =
      errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `lci-val-eng-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: LCI_METADATA_VERSION,
    };
  }
}
