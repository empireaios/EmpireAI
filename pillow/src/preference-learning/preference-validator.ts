/** T4-08 — Preference learning output validation. */

import type { PreferenceLearningConfiguration } from "./configuration.js";
import type {
  CollaborationPreferenceRecord,
  PreferenceLearningValidationReport,
  ValidationDecision,
} from "./types.js";
import { PreferenceMetadataGenerator } from "./preference-metadata-generator.js";
import { appendPreferenceLog } from "./preference-logging.js";
import { PREFERENCE_METADATA_VERSION } from "./paths.js";

export class PreferenceValidator {
  private readonly metadata = new PreferenceMetadataGenerator();

  validate(
    preferences: CollaborationPreferenceRecord[],
    config: PreferenceLearningConfiguration,
    extras?: { autoApproved?: boolean; autoExecuted?: boolean },
  ): PreferenceLearningValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.outputValidationEnabled || !config.validationRulesEnabled) {
      return this.buildReport("pass", preferences.length, 0, errors, warnings, started);
    }

    if (preferences.length === 0) {
      warnings.push("No preferences learned in this session");
    }

    for (const pref of preferences) {
      if (!pref.preferenceDescription) warnings.push(`Missing description for ${pref.preferenceId}`);
      if (pref.confidenceScore < config.confidenceThreshold) {
        warnings.push(
          `Low confidence for ${pref.preferenceCategory}: ${pref.confidenceScore}`,
        );
      }
      if (
        config.explicitEvidenceRulesEnabled &&
        pref.explicitEvidenceReferences.length === 0
      ) {
        warnings.push(`No explicit evidence for ${pref.preferenceCategory}`);
      }
    }

    if (extras?.autoApproved) errors.push("Preference learning must not approve automatically");
    if (extras?.autoExecuted) errors.push("Preference learning must not execute UX changes");

    let decision: ValidationDecision = "pass";
    if (errors.length > 0) decision = "fail";
    else if (warnings.length > 0) decision = "partial";

    appendPreferenceLog({
      event: "validation_results",
      level: decision === "pass" ? "info" : "warn",
      details: `Validation ${decision.toUpperCase()} · ${preferences.length} preferences`,
    });

    return this.buildReport(decision, preferences.length, 0, errors, warnings, started);
  }

  private buildReport(
    decision: ValidationDecision,
    learned: number,
    updated: number,
    errors: string[],
    warnings: string[],
    started: number,
  ): PreferenceLearningValidationReport {
    return {
      validationReportId: this.metadata.buildValidationId(),
      validationTimestamp: new Date().toISOString(),
      decision,
      preferencesLearned: learned,
      preferencesUpdated: updated,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: PREFERENCE_METADATA_VERSION,
    };
  }
}
