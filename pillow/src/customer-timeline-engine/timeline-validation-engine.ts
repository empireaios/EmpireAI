/** R4-03 — Timeline validation engine. */

import { CTE_METADATA_VERSION } from "./paths.js";
import type { CustomerTimelineEngineConfiguration } from "./configuration.js";
import type { TimelineRecord, TimelineValidationReport } from "./types.js";

export class TimelineValidationEngine {
  validateTimelineRecord(
    record: TimelineRecord,
    config: CustomerTimelineEngineConfiguration,
  ): TimelineValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.timelineRecordId) errors.push("Missing timeline record ID");
    if (!record.customerId) errors.push("Missing customer ID");
    if (!record.eventReference?.trim()) errors.push("Missing event reference");
    if (!record.eventDescription?.trim()) errors.push("Missing event description");

    if (config.eventClassificationRulesEnabled) {
      const rule = config.eventClassificationRules.find((r) => r.eventType === record.eventType);
      if (rule && !rule.enabled) {
        errors.push(`Event type ${record.eventType} is not enabled`);
      }
    }

    if (config.validationRulesEnabled && record.eventStatus === "failed") {
      warnings.push("Event recorded with failed status");
    }

    const decision =
      errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `cte-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: CTE_METADATA_VERSION,
    };
  }
}
