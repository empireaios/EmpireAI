/** T5-06 — Adaptive interface record validation. */

import { randomUUID } from "node:crypto";
import { ADAPTIVE_METADATA_VERSION } from "./paths.js";
import type { AdaptiveInterfaceConfiguration } from "./configuration.js";
import type { AdaptiveInterfaceRecord, AdaptiveValidationReport } from "./types.js";

export class AdaptiveValidator {
  validate(
    records: AdaptiveInterfaceRecord[],
    config: AdaptiveInterfaceConfiguration,
  ): AdaptiveValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const record of records) {
      if (!record.adaptiveInterfaceId) errors.push("Missing adaptive interface ID");
      if (record.recommendOnly !== true) errors.push("Record must remain recommend-only");
      if (record.confidenceScore < config.confidenceThreshold) {
        warnings.push(`Record ${record.adaptiveInterfaceId} confidence below threshold`);
      }
      if (!record.evidenceReferences.length) {
        warnings.push(`Record ${record.adaptiveInterfaceId} lacks evidence references`);
      }
      if (!record.recommendedInterfaceAdaptations.length) {
        warnings.push(`Record ${record.adaptiveInterfaceId} lacks interface adaptations`);
      }
    }

    if (!records.length) {
      warnings.push("No adaptive interface recommendations in this cycle");
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
      metadataVersion: ADAPTIVE_METADATA_VERSION,
    };
  }
}
