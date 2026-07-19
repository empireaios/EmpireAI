/** R4-09 — Ticket validation engine. */

import { TME_METADATA_VERSION } from "./paths.js";
import type { TicketManagementEngineConfiguration } from "./configuration.js";
import type { TicketRecord, TicketValidationReport } from "./types.js";

export class TicketValidationEngine {
  validateTicketRecord(
    record: TicketRecord,
    config: TicketManagementEngineConfiguration,
  ): TicketValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.ticketId) errors.push("Missing ticket ID");
    if (!record.customerId) errors.push("Missing customer ID");
    if (!record.conversationReference) errors.push("Missing conversation reference");

    if (config.validationRulesEnabled && record.currentStatus === "failed") {
      warnings.push("Ticket processing failed");
    }

    if (
      config.validationRulesEnabled &&
      (record.currentStatus === "closed" || record.currentStatus === "resolved") &&
      record.validationStatus === "failed"
    ) {
      errors.push("Cannot close ticket without validation");
    }

    const decision =
      errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `tme-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: TME_METADATA_VERSION,
    };
  }
}
