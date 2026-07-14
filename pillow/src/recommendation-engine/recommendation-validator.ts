/** T2-09 — Recommendation validation. */

import { RECOMMENDATION_METADATA_VERSION } from "./paths.js";
import type {
  RecommendationRecord,
  RecommendationValidationReport,
  ValidationDecision,
} from "./types.js";
import type { RecommendationEngineConfiguration } from "./configuration.js";

export class RecommendationValidator {
  validate(
    record: RecommendationRecord,
    config: RecommendationEngineConfiguration,
  ): RecommendationValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.validationRulesEnabled) {
      return this.report("pass", record, errors, warnings, started);
    }

    if (!record.recommendationRecordId) errors.push("Recommendation record missing ID");
    if (record.proposals.length === 0) {
      warnings.push("No redesign proposals generated");
    }
    if (!record.sourceUxScoreId && record.proposals.length > 0) {
      warnings.push("Proposals generated without UX score reference");
    }
    for (const proposal of record.proposals) {
      if (!proposal.recommendationTitle) errors.push(`Proposal ${proposal.recommendationId} missing title`);
      if (config.evidenceRequirementsEnabled && proposal.evidenceReferences.length === 0) {
        warnings.push(`Proposal ${proposal.recommendationId} lacks evidence references`);
      }
      if (proposal.confidenceScore < config.confidenceThreshold * 100) {
        warnings.push(`Proposal ${proposal.recommendationId} below confidence threshold`);
      }
    }

    let decision: ValidationDecision = "pass";
    if (errors.length > 0) decision = "fail";
    else if (warnings.length > 0) decision = "partial";

    return this.report(decision, record, errors, warnings, started);
  }

  private report(
    decision: ValidationDecision,
    record: RecommendationRecord,
    errors: string[],
    warnings: string[],
    started: number,
  ): RecommendationValidationReport {
    const categories = new Set(record.proposals.map((p) => p.recommendationCategory));
    return {
      validationReportId: `rec-validation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      proposalsValidated: record.proposals.length,
      categoriesCovered: categories.size,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: RECOMMENDATION_METADATA_VERSION,
    };
  }
}
