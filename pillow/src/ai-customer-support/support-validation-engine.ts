/** R4-08 — Support validation engine. */

import { ACS_METADATA_VERSION } from "./paths.js";
import type { AiCustomerSupportConfiguration } from "./configuration.js";
import type { AiSupportRecord, AiSupportValidationReport } from "./types.js";

export class SupportValidationEngine {
  validateAiSupportRecord(
    record: AiSupportRecord,
    config: AiCustomerSupportConfiguration,
  ): AiSupportValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.aiSupportRecordId) errors.push("Missing AI support record ID");
    if (!record.customerId) errors.push("Missing customer ID");
    if (!record.conversationReference) errors.push("Missing conversation reference");

    if (config.validationRulesEnabled && record.resolutionStatus === "failed") {
      warnings.push("Support enquiry failed");
    }

    const decision =
      errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `acs-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: ACS_METADATA_VERSION,
    };
  }
}
