/** R4-10 — Sentiment validation engine. */

import { CSE_METADATA_VERSION } from "./paths.js";
import type { CustomerSentimentEngineConfiguration } from "./configuration.js";
import type { SentimentRecord, SentimentValidationReport } from "./types.js";

export class SentimentValidationEngine {
  validateSentimentRecord(
    record: SentimentRecord,
    config: CustomerSentimentEngineConfiguration,
  ): SentimentValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.sentimentRecordId) errors.push("Missing sentiment record ID");
    if (!record.customerId) errors.push("Missing customer ID");
    if (!record.conversationReference) errors.push("Missing conversation reference");
    if (record.sentimentScore < 0 || record.sentimentScore > 100) {
      errors.push("Sentiment score must be between 0 and 100");
    }
    if (record.confidenceScore < 0 || record.confidenceScore > 100) {
      errors.push("Confidence score must be between 0 and 100");
    }

    if (config.validationRulesEnabled && record.validationStatus === "failed") {
      warnings.push("Sentiment record validation failed");
    }

    const decision =
      errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `cse-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: CSE_METADATA_VERSION,
    };
  }
}
