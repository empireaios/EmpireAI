/** R4-05 — SMS validation engine. */

import { SCE_METADATA_VERSION } from "./paths.js";
import type { SmsCommunicationEngineConfiguration } from "./configuration.js";
import type { SmsRecord, SmsTemplate, SmsValidationReport } from "./types.js";

export class SmsValidationEngine {
  validateSmsRecord(
    record: SmsRecord,
    config: SmsCommunicationEngineConfiguration,
  ): SmsValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.smsRecordId) errors.push("Missing SMS record ID");
    if (!record.customerId) errors.push("Missing customer ID");
    if (!record.recipientPhoneNumber) errors.push("Missing recipient phone number");

    if (config.validationRulesEnabled && record.deliveryStatus === "failed") {
      warnings.push("SMS delivery failed");
    }

    const decision =
      errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `sce-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: SCE_METADATA_VERSION,
    };
  }

  validateTemplate(template: SmsTemplate): SmsValidationReport {
    const started = Date.now();
    const errors: string[] = [];

    if (!template.templateName?.trim()) errors.push("Template name is required");
    if (!template.bodyTemplate?.trim()) errors.push("Template body is required");

    const decision = errors.length > 0 ? "fail" : "pass";

    return {
      validationReportId: `sce-val-tpl-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings: [],
      durationMs: Date.now() - started,
      metadataVersion: SCE_METADATA_VERSION,
    };
  }
}
