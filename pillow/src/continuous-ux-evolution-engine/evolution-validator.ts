/** T5-07 — UX evolution record validation. */

import { randomUUID } from "node:crypto";
import { UX_EVOLUTION_METADATA_VERSION } from "./paths.js";
import type { ContinuousUxEvolutionConfiguration } from "./configuration.js";
import type { EvolutionValidationReport, UxEvolutionRecord } from "./types.js";

export class EvolutionValidator {
  validate(
    records: UxEvolutionRecord[],
    config: ContinuousUxEvolutionConfiguration,
  ): EvolutionValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const record of records) {
      if (!record.uxEvolutionId) errors.push("Missing UX evolution ID");
      if (record.recommendOnly !== true) errors.push("Record must remain recommend-only");
      if (record.confidenceScore < config.confidenceThreshold) {
        warnings.push(`Record ${record.uxEvolutionId} confidence below threshold`);
      }
      if (!record.evidenceReferences.length) {
        warnings.push(`Record ${record.uxEvolutionId} lacks evidence references`);
      }
      if (!record.recommendedUxImprovements.length) {
        warnings.push(`Record ${record.uxEvolutionId} lacks UX improvements`);
      }
    }

    if (!records.length) {
      warnings.push("No UX evolution recommendations in this cycle");
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
      metadataVersion: UX_EVOLUTION_METADATA_VERSION,
    };
  }
}
