/** T4-06 — Explanation output validation. */

import type { ExplainDecisionsConfiguration } from "./configuration.js";
import type {
  ExplanationDecision,
  ExplanationRecord,
  ExplanationRunValidationReport,
} from "./types.js";
import { ExplanationMetadataGenerator } from "./explanation-metadata-generator.js";
import { appendExplanationLog } from "./explanation-logging.js";
import { EXPLANATION_METADATA_VERSION } from "./paths.js";

export class ExplanationValidator {
  private readonly metadata = new ExplanationMetadataGenerator();

  validate(
    explanation: ExplanationRecord | null,
    config: ExplainDecisionsConfiguration,
    extras?: { appliedChanges?: boolean; approvedChanges?: boolean },
  ): ExplanationRunValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.outputValidationEnabled || !config.validationRulesEnabled) {
      return this.buildReport("pass", explanation, errors, warnings, started);
    }

    if (!explanation) {
      errors.push("No explanation record produced");
      return this.buildReport("fail", explanation, errors, warnings, started);
    }

    if (!explanation.designRationale) warnings.push("Missing design rationale");
    if (!explanation.uxBenefitSummary) warnings.push("Missing UX benefit summary");
    if (explanation.evidenceReferences.length === 0) {
      warnings.push("No evidence references linked");
    }
    if (
      config.weakEvidenceWarningEnabled &&
      explanation.weakEvidenceNotes.length > 0
    ) {
      warnings.push(
        `Weak or missing evidence noted (${explanation.weakEvidenceNotes.length})`,
      );
    }
    if (explanation.confidenceScore < config.confidenceThreshold) {
      warnings.push(
        `Confidence ${explanation.confidenceScore} below threshold ${config.confidenceThreshold}`,
      );
    }
    if (extras?.appliedChanges) {
      errors.push("Explanations must not apply UX changes automatically");
    }
    if (extras?.approvedChanges) {
      errors.push("Explanations must not approve changes automatically");
    }

    let decision: ExplanationDecision = "pass";
    if (errors.length > 0) decision = "fail";
    else if (warnings.length > 0) decision = "partial";

    appendExplanationLog({
      event: "validation_results",
      level: decision === "pass" ? "info" : "warn",
      details: `Validation ${decision.toUpperCase()}`,
    });

    return this.buildReport(decision, explanation, errors, warnings, started);
  }

  private buildReport(
    decision: ExplanationDecision,
    explanation: ExplanationRecord | null,
    errors: string[],
    warnings: string[],
    started: number,
  ): ExplanationRunValidationReport {
    return {
      validationReportId: this.metadata.buildValidationId(),
      validationTimestamp: new Date().toISOString(),
      decision,
      explanationsProcessed: explanation ? 1 : 0,
      evidenceLinked: explanation?.evidenceReferences.length ?? 0,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: EXPLANATION_METADATA_VERSION,
    };
  }
}
