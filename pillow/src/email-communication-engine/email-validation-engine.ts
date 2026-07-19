/** R4-04 — Email validation engine. */

import { ECE_METADATA_VERSION } from "./paths.js";
import type { EmailCommunicationEngineConfiguration } from "./configuration.js";
import type { EmailRecord, EmailTemplate, EmailValidationReport } from "./types.js";

export class EmailValidationEngine {
  validateEmailRecord(
    record: EmailRecord,
    config: EmailCommunicationEngineConfiguration,
  ): EmailValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.emailRecordId) errors.push("Missing email record ID");
    if (!record.customerId) errors.push("Missing customer ID");
    if (!record.recipientAddress?.includes("@")) errors.push("Invalid recipient address");

    if (config.validationRulesEnabled && record.deliveryStatus === "failed") {
      warnings.push("Email delivery failed");
    }

    const decision =
      errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `ece-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: ECE_METADATA_VERSION,
    };
  }

  validateTemplate(template: EmailTemplate): EmailValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!template.templateName?.trim()) errors.push("Template name is required");
    if (!template.subject?.trim()) errors.push("Template subject is required");
    if (!template.bodyTemplate?.trim()) errors.push("Template body is required");

    const decision =
      errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `ece-val-tpl-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: ECE_METADATA_VERSION,
    };
  }
}
