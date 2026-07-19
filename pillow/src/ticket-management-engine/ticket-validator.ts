/** R4-09 — Ticket validator. */

import { TME_METADATA_VERSION } from "./paths.js";
import type { TicketManagementEngineConfiguration } from "./configuration.js";
import type { TicketEngineRecord, TicketValidationReport } from "./types.js";

export class TicketValidator {
  validateConfiguration(
    config: TicketManagementEngineConfiguration,
  ): TicketValidationReport {
    const started = Date.now();
    const errors: string[] = [];

    if (config.maxRetryAttempts < 0) errors.push("maxRetryAttempts must be non-negative");
    if (config.overdueThresholdHours < 1) errors.push("overdueThresholdHours must be at least 1");
    if (config.stalledThresholdHours < 1) errors.push("stalledThresholdHours must be at least 1");

    return {
      validationReportId: `tme-val-cfg-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: errors.length > 0 ? "fail" : "pass",
      errors,
      warnings: [],
      durationMs: Date.now() - started,
      metadataVersion: TME_METADATA_VERSION,
    };
  }

  validateEngineRecord(record: TicketEngineRecord): TicketValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.engineId) errors.push("Missing engine ID");
    if (!record.crmFoundationConnected) warnings.push("CRM Foundation not connected");
    if (!record.timelineEngineConnected) warnings.push("Customer Timeline Engine not connected");

    const decision =
      errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `tme-val-eng-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: TME_METADATA_VERSION,
    };
  }
}
