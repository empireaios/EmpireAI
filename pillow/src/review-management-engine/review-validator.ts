/** R4-11 — Review validator. */

import { RME_METADATA_VERSION } from "./paths.js";
import type { ReviewManagementEngineConfiguration } from "./configuration.js";
import type { ReviewEngineRecord, ReviewValidationReport } from "./types.js";

export class ReviewValidator {
  validateConfiguration(
    config: ReviewManagementEngineConfiguration,
  ): ReviewValidationReport {
    const started = Date.now();
    const errors: string[] = [];

    if (config.maxRetryAttempts < 0) errors.push("maxRetryAttempts must be non-negative");
    if (config.negativeRatingThreshold < 1 || config.negativeRatingThreshold > 5) {
      errors.push("negativeRatingThreshold must be between 1 and 5");
    }
    if (config.positiveRatingThreshold < 1 || config.positiveRatingThreshold > 5) {
      errors.push("positiveRatingThreshold must be between 1 and 5");
    }

    return {
      validationReportId: `rme-val-cfg-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: errors.length > 0 ? "fail" : "pass",
      errors,
      warnings: [],
      durationMs: Date.now() - started,
      metadataVersion: RME_METADATA_VERSION,
    };
  }

  validateEngineRecord(record: ReviewEngineRecord): ReviewValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.engineId) errors.push("Missing engine ID");
    if (!record.identityEngineConnected) warnings.push("Customer Identity Engine not connected");
    if (!record.timelineEngineConnected) warnings.push("Customer Timeline Engine not connected");

    const decision =
      errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `rme-val-eng-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: RME_METADATA_VERSION,
    };
  }
}
