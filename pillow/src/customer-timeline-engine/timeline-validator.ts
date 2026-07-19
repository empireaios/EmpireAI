/** R4-03 — Timeline validator. */

import { CTE_METADATA_VERSION } from "./paths.js";
import type { CustomerTimelineEngineConfiguration } from "./configuration.js";
import type { TimelineEngineRecord, TimelineValidationReport } from "./types.js";

export class TimelineValidator {
  validateConfiguration(
    config: CustomerTimelineEngineConfiguration,
  ): TimelineValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (config.maxRetryAttempts < 0) errors.push("maxRetryAttempts must be non-negative");
    if (config.defaultSearchLimit < 1) errors.push("defaultSearchLimit must be at least 1");

    const decision =
      errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `cte-val-cfg-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: CTE_METADATA_VERSION,
    };
  }

  validateEngineRecord(record: TimelineEngineRecord): TimelineValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.engineId) errors.push("Missing engine ID");
    if (!record.identityEngineConnected) warnings.push("Customer Identity Engine not connected");
    if (!record.crmFoundationConnected) warnings.push("CRM Foundation not connected");

    const decision =
      errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `cte-val-eng-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: CTE_METADATA_VERSION,
    };
  }
}
