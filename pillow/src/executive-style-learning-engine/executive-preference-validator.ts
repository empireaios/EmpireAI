/** T2-03 — Executive preference validation. */

import { PREFERENCE_METADATA_VERSION } from "./paths.js";
import type {
  ExecutiveStyleModel,
  PreferenceRecord,
  PreferenceValidationReport,
  ValidationDecision,
} from "./types.js";

export class ExecutivePreferenceValidator {
  validate(
    model: ExecutiveStyleModel,
    preferences: PreferenceRecord[],
    enabled: boolean,
  ): PreferenceValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!enabled) {
      return this.report("pass", preferences.length, 0, errors, warnings, started);
    }

    if (!model.executiveStyleId) errors.push("Executive style model missing ID");
    if (preferences.length === 0) {
      warnings.push("No preferences learned — model uses design system defaults");
    }

    const conflicted = preferences.filter((p) => p.currentStatus === "conflicted");
    if (conflicted.length > 0) {
      warnings.push(`${conflicted.length} preferences remain conflicted`);
    }

    const lowConfidence = preferences.filter(
      (p) => p.learningConfidence < 0.3 && p.currentStatus === "active",
    );
    if (lowConfidence.length > 0) {
      warnings.push(`${lowConfidence.length} active preferences below confidence threshold`);
    }

    if (model.confidenceScore < 30 && preferences.length > 0) {
      warnings.push(`Overall confidence score low: ${model.confidenceScore}`);
    }

    let decision: ValidationDecision = "pass";
    if (errors.length > 0) decision = "fail";
    else if (warnings.length > 0) decision = "partial";

    return this.report(decision, preferences.length, conflicted.length, errors, warnings, started);
  }

  private report(
    decision: ValidationDecision,
    preferencesValidated: number,
    conflictsResolved: number,
    errors: string[],
    warnings: string[],
    started: number,
  ): PreferenceValidationReport {
    return {
      validationReportId: `esl-validation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      preferencesValidated,
      conflictsResolved,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: PREFERENCE_METADATA_VERSION,
    };
  }
}
