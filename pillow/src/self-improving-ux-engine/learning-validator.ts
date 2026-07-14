/** T5-09 — UX learning record validation. */

import { randomUUID } from "node:crypto";
import { UX_LEARNING_METADATA_VERSION } from "./paths.js";
import type { SelfImprovingUxConfiguration } from "./configuration.js";
import type { LearningValidationReport, UxLearningRecord } from "./types.js";

export class LearningValidator {
  validate(
    records: UxLearningRecord[],
    config: SelfImprovingUxConfiguration,
  ): LearningValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const record of records) {
      if (!record.learningId) errors.push("Missing learning ID");
      if (record.learnOnly !== true) errors.push("Record must remain learn-only");
      if (record.confidenceScore < config.confidenceThreshold) {
        warnings.push(`Record ${record.learningId} confidence below threshold`);
      }
      if (!record.evidenceReferences.length) {
        warnings.push(`Record ${record.learningId} lacks evidence references`);
      }
      if (!record.learnedUxInsight) {
        warnings.push(`Record ${record.learningId} lacks learned UX insight`);
      }
      if (!record.recommendationImprovement) {
        warnings.push(`Record ${record.learningId} lacks recommendation improvement`);
      }
    }

    if (!records.length) {
      warnings.push("No UX learning records in this cycle");
    }

    const decision =
      errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: randomUUID(),
      validationTimestamp: new Date().toISOString(),
      decision,
      recordsValidated: records.length,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: UX_LEARNING_METADATA_VERSION,
    };
  }
}
