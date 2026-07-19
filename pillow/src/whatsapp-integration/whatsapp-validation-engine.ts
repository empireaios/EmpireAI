/** R4-06 — WhatsApp validation engine. */

import { WAI_METADATA_VERSION } from "./paths.js";
import type { WhatsAppIntegrationConfiguration } from "./configuration.js";
import type { WhatsAppRecord, WhatsAppTemplate, WhatsAppValidationReport } from "./types.js";

export class WhatsAppValidationEngine {
  validateWhatsAppRecord(
    record: WhatsAppRecord,
    config: WhatsAppIntegrationConfiguration,
  ): WhatsAppValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.whatsAppRecordId) errors.push("Missing WhatsApp record ID");
    if (!record.customerId) errors.push("Missing customer ID");
    if (!record.conversationId) errors.push("Missing conversation ID");
    if (!record.recipientPhoneNumber) errors.push("Missing recipient phone number");

    if (config.validationRulesEnabled && record.deliveryStatus === "failed") {
      warnings.push("WhatsApp message delivery failed");
    }

    const decision =
      errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `wai-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: WAI_METADATA_VERSION,
    };
  }

  validateTemplate(template: WhatsAppTemplate): WhatsAppValidationReport {
    const started = Date.now();
    const errors: string[] = [];

    if (!template.templateName?.trim()) errors.push("Template name is required");
    if (!template.bodyTemplate?.trim()) errors.push("Template body is required");

    const decision = errors.length > 0 ? "fail" : "pass";

    return {
      validationReportId: `wai-val-tpl-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings: [],
      durationMs: Date.now() - started,
      metadataVersion: WAI_METADATA_VERSION,
    };
  }
}
