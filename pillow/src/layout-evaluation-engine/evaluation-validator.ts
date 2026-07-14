/** T2-04 — Layout evaluation validation. */

import { EVALUATION_METADATA_VERSION } from "./paths.js";
import type {
  LayoutEvaluationModel,
  LayoutEvaluationValidationReport,
  ValidationDecision,
} from "./types.js";

export class EvaluationValidator {
  validate(
    model: LayoutEvaluationModel,
    enabled: boolean,
  ): LayoutEvaluationValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!enabled) {
      return this.report("pass", model, errors, warnings, started);
    }

    if (!model.evaluationId) errors.push("Evaluation model missing ID");
    if (model.overallEvaluationStatus === "skipped") {
      warnings.push("Evaluation skipped — incomplete layout data");
    }
    if (model.layoutWeaknesses.length === 0 && model.layoutStrengths.length === 0) {
      warnings.push("No layout findings generated");
    }
    if (model.ruleViolations.length > 0) {
      warnings.push(`${model.ruleViolations.length} UX rule violation(s) detected`);
    }
    if (model.designSystemDeviations.length > 0) {
      warnings.push(`${model.designSystemDeviations.length} design system deviation(s) detected`);
    }
    if (model.executivePreferenceDeviations.length > 0) {
      warnings.push(
        `${model.executivePreferenceDeviations.length} executive preference deviation(s) detected`,
      );
    }
    if (model.confidenceScore < 30 && model.overallEvaluationStatus !== "skipped") {
      warnings.push(`Low evaluation confidence: ${model.confidenceScore}`);
    }

    let decision: ValidationDecision = "pass";
    if (errors.length > 0) decision = "fail";
    else if (warnings.length > 0 || model.overallEvaluationStatus === "partial") {
      decision = "partial";
    }
    if (model.overallEvaluationStatus === "fail") decision = "fail";

    return this.report(decision, model, errors, warnings, started);
  }

  private report(
    decision: ValidationDecision,
    model: LayoutEvaluationModel,
    errors: string[],
    warnings: string[],
    started: number,
  ): LayoutEvaluationValidationReport {
    return {
      validationReportId: `lev-validation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      evaluationsValidated: 1,
      strengthsIdentified: model.layoutStrengths.length,
      weaknessesIdentified: model.layoutWeaknesses.length,
      ruleViolationsDetected: model.ruleViolations.length,
      designSystemDeviationsDetected: model.designSystemDeviations.length,
      executiveDeviationsDetected: model.executivePreferenceDeviations.length,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: EVALUATION_METADATA_VERSION,
    };
  }
}
