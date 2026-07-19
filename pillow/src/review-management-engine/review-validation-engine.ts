/** R4-11 — Review validation engine. */

import { RME_METADATA_VERSION } from "./paths.js";
import type { ReviewManagementEngineConfiguration } from "./configuration.js";
import type { ReviewRecord, ReviewValidationReport } from "./types.js";

export class ReviewValidationEngine {
  validateReviewRecord(
    record: ReviewRecord,
    config: ReviewManagementEngineConfiguration,
  ): ReviewValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.reviewRecordId) errors.push("Missing review record ID");
    if (!record.customerId) errors.push("Missing customer ID");
    if (!record.marketplaceReference) errors.push("Missing marketplace reference");
    if (!record.productReference) errors.push("Missing product reference");
    if (record.reviewRating < 1 || record.reviewRating > 5) {
      errors.push("Review rating must be between 1 and 5");
    }

    if (config.validationRulesEnabled && record.validationStatus === "failed") {
      warnings.push("Review record validation failed");
    }

    const decision =
      errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `rme-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: RME_METADATA_VERSION,
    };
  }
}
