/** T5-04 — Productivity intelligence record validation. */

import { randomUUID } from "node:crypto";
import { PRODUCTIVITY_METADATA_VERSION } from "./paths.js";
import type { ProductivityIntelligenceConfiguration } from "./configuration.js";
import type {
  ProductivityIntelligenceRecord,
  ProductivityValidationReport,
} from "./types.js";

export class ProductivityValidator {
  validate(
    records: ProductivityIntelligenceRecord[],
    config: ProductivityIntelligenceConfiguration,
  ): ProductivityValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const record of records) {
      if (!record.productivityId) errors.push("Missing productivity ID");
      if (record.learnOnly !== true) errors.push("Record must remain learn-only");
      if (record.confidenceScore < config.confidenceThreshold) {
        warnings.push(
          `Record ${record.productivityId} confidence below threshold`,
        );
      }
      if (!record.evidenceReferences.length) {
        warnings.push(`Record ${record.productivityId} lacks evidence references`);
      }
      if (!record.productivityObservations.length) {
        warnings.push(`Record ${record.productivityId} lacks productivity observations`);
      }
    }

    if (!records.length) {
      warnings.push("No productivity patterns learned in this cycle");
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
      metadataVersion: PRODUCTIVITY_METADATA_VERSION,
    };
  }
}
