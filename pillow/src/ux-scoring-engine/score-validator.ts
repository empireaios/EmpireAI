/** T2-08 — UX score validation. */

import { SCORING_METADATA_VERSION } from "./paths.js";
import type { UxScoreRecord, UxScoringValidationReport, ValidationDecision } from "./types.js";
import type { UxScoringConfiguration } from "./configuration.js";

export class ScoreValidator {
  validate(record: UxScoreRecord, config: UxScoringConfiguration): UxScoringValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.validationRulesEnabled) {
      return this.report("pass", record, errors, warnings, started);
    }

    if (!record.uxScoreId) errors.push("UX score record missing ID");
    if (record.overallUxScore < config.minimumScoreThreshold) {
      warnings.push(`Overall score below minimum threshold (${config.minimumScoreThreshold})`);
    }
    if (record.overallUxScore < config.passThreshold) {
      warnings.push(`Overall score below pass threshold (${config.passThreshold})`);
    }
    if (record.scoreBreakdown.length === 0) {
      warnings.push("No score breakdown entries generated");
    }
    if (!record.sourceUxRuleResultIds.length && !record.sourceLayoutEvaluationId) {
      warnings.push("Limited upstream data — partial UX scoring");
    }
    if (record.confidenceScore < 30) {
      warnings.push(`Low scoring confidence: ${record.confidenceScore}`);
    }

    let decision: ValidationDecision = "pass";
    if (errors.length > 0) decision = "fail";
    else if (warnings.length > 0) decision = "partial";

    return this.report(decision, record, errors, warnings, started);
  }

  private report(
    decision: ValidationDecision,
    record: UxScoreRecord,
    errors: string[],
    warnings: string[],
    started: number,
  ): UxScoringValidationReport {
    return {
      validationReportId: `uxs-validation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      scoresValidated: 1,
      categoriesScored: record.scoreBreakdown.length,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: SCORING_METADATA_VERSION,
    };
  }
}
