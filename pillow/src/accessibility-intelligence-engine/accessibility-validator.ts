/** T2-06 — Accessibility review validation. */

import { ACCESSIBILITY_METADATA_VERSION } from "./paths.js";
import type {
  AccessibilityReviewRecord,
  AccessibilityValidationReport,
  ValidationDecision,
} from "./types.js";

export class AccessibilityValidator {
  validate(
    record: AccessibilityReviewRecord,
    enabled: boolean,
  ): AccessibilityValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!enabled) {
      return this.report("pass", record, errors, warnings, started);
    }

    if (!record.accessibilityReviewId) errors.push("Accessibility review record missing ID");
    if (!record.sourceUiStateId && !record.sourceComponentSetId) {
      warnings.push("No UI state or component data — partial accessibility review");
    }
    if (record.accessibilityFindings.length === 0 && record.accessibilityStrengths.length === 0) {
      warnings.push("No accessibility findings or strengths detected");
    }
    if (record.severity === "error") {
      warnings.push("High-severity accessibility issues detected");
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
    record: AccessibilityReviewRecord,
    errors: string[],
    warnings: string[],
    started: number,
  ): AccessibilityValidationReport {
    return {
      validationReportId: `aii-validation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      reviewsValidated: 1,
      findingsDetected: record.accessibilityFindings.length,
      strengthsIdentified: record.accessibilityStrengths.length,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: ACCESSIBILITY_METADATA_VERSION,
    };
  }
}
