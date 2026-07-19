/** R4-10 — Sentiment validator. */

import { CSE_METADATA_VERSION } from "./paths.js";
import type { CustomerSentimentEngineConfiguration } from "./configuration.js";
import type { SentimentEngineRecord, SentimentValidationReport } from "./types.js";

export class SentimentValidator {
  validateConfiguration(
    config: CustomerSentimentEngineConfiguration,
  ): SentimentValidationReport {
    const started = Date.now();
    const errors: string[] = [];

    if (config.maxRetryAttempts < 0) errors.push("maxRetryAttempts must be non-negative");
    if (config.frustrationThreshold < 0 || config.frustrationThreshold > 100) {
      errors.push("frustrationThreshold must be between 0 and 100");
    }

    return {
      validationReportId: `cse-val-cfg-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: errors.length > 0 ? "fail" : "pass",
      errors,
      warnings: [],
      durationMs: Date.now() - started,
      metadataVersion: CSE_METADATA_VERSION,
    };
  }

  validateEngineRecord(record: SentimentEngineRecord): SentimentValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.engineId) errors.push("Missing engine ID");
    if (!record.timelineEngineConnected) warnings.push("Customer Timeline Engine not connected");

    const decision =
      errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `cse-val-eng-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: CSE_METADATA_VERSION,
    };
  }
}
