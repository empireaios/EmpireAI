/** T2-07 — Consistency review validation. */

import { CONSISTENCY_METADATA_VERSION } from "./paths.js";
import type {
  ConsistencyReviewRecord,
  ConsistencyValidationReport,
  ValidationDecision,
} from "./types.js";

export class ConsistencyValidator {
  validate(record: ConsistencyReviewRecord, enabled: boolean): ConsistencyValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!enabled) {
      return this.report("pass", record, errors, warnings, started);
    }

    if (!record.consistencyReviewId) errors.push("Consistency review record missing ID");
    if (!record.sourceUiStateId && !record.sourceComponentSetId) {
      warnings.push("No UI state or component data — partial consistency review");
    }
    if (!record.sourceDesignSystemId) {
      warnings.push("No design system data — consistency checks limited");
    }
    if (record.consistencyFindings.length === 0 && record.consistencyStrengths.length === 0) {
      warnings.push("No consistency findings or strengths detected");
    }
    if (record.severity === "error") {
      warnings.push("High-severity consistency issues detected");
    }
    if (record.confidenceScore < 30) {
      warnings.push(`Low review confidence: ${record.confidenceScore}`);
    }

    let decision: ValidationDecision = "pass";
    if (errors.length > 0) decision = "fail";
    else if (warnings.length > 0) decision = "partial";

    return this.report(decision, record, errors, warnings, started);
  }

  private report(
    decision: ValidationDecision,
    record: ConsistencyReviewRecord,
    errors: string[],
    warnings: string[],
    started: number,
  ): ConsistencyValidationReport {
    return {
      validationReportId: `vce-validation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      reviewsValidated: 1,
      findingsDetected: record.consistencyFindings.length,
      strengthsIdentified: record.consistencyStrengths.length,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: CONSISTENCY_METADATA_VERSION,
    };
  }
}
