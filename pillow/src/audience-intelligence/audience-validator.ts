/** R5-08 — Audience Validator. */

import { AUD_METADATA_VERSION } from "./paths.js";
import type { AudienceIntelligenceConfiguration } from "./configuration.js";
import type {
  AudienceEngineRecord,
  AudienceRecord,
  AudienceValidationReport,
  BuildAudienceInput,
} from "./types.js";

export class AudienceValidator {
  validateConfiguration(config: AudienceIntelligenceConfiguration): AudienceValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.enabled) warnings.push("Audience Intelligence disabled");
    if (!config.validationRulesEnabled) {
      warnings.push("Validation rules disabled by configuration");
    }
    if (!config.redactPiiInRecords) {
      errors.push("PII redaction must remain enabled");
    }

    return this.build(errors, warnings, started);
  }

  validateEngineRecord(record: AudienceEngineRecord): AudienceValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.engineRecordId.startsWith("aud-")) errors.push("Invalid engine record ID prefix");
    if (!record.metadataVersion) errors.push("Missing metadata version");

    const connected = Object.values(record.dependencyPresence).filter(Boolean).length;
    if (connected === 0) warnings.push("No audience data dependencies connected");
    if (!record.dependencyPresence.customerSegmentation) {
      warnings.push("Customer Segmentation dependency not connected");
    }

    return this.build(errors, warnings, started);
  }

  validateAudienceBuild(
    input: BuildAudienceInput,
    config: AudienceIntelligenceConfiguration,
  ): AudienceValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.validationRulesEnabled) {
      return this.build([], ["Validation rules disabled"], started);
    }
    if (!input.audienceName?.trim()) errors.push("Audience name is required");
    if (input.estimatedSize !== undefined && input.estimatedSize <= 0) {
      errors.push("Audience size must be positive");
    }

    return this.build(errors, warnings, started);
  }

  validateAudienceRecord(record: AudienceRecord): AudienceValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.audienceRecordId.startsWith("aud-rec-")) {
      errors.push("Invalid audience record ID prefix");
    }
    if (!record.audienceName) errors.push("Missing audience name");
    if (record.audienceSize <= 0) errors.push("Invalid audience size");
    if (!record.piiRedacted) errors.push("Audience record must redact PII");
    if (record.audienceQualityScore < 0 || record.audienceQualityScore > 100) {
      errors.push("Audience quality score out of range");
    }

    return this.build(errors, warnings, started);
  }

  private build(
    errors: string[],
    warnings: string[],
    started: number,
  ): AudienceValidationReport {
    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";
    return {
      validationReportId: `aud-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: AUD_METADATA_VERSION,
    };
  }
}
