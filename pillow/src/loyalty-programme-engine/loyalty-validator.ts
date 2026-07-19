/** R4-12 — Loyalty validator. */

import { LPE_METADATA_VERSION } from "./paths.js";
import type { LoyaltyProgrammeEngineConfiguration } from "./configuration.js";
import type { LoyaltyEngineRecord, LoyaltyValidationReport } from "./types.js";

export class LoyaltyValidator {
  validateConfiguration(
    config: LoyaltyProgrammeEngineConfiguration,
  ): LoyaltyValidationReport {
    const started = Date.now();
    const errors: string[] = [];

    if (config.maxRetryAttempts < 0) errors.push("maxRetryAttempts must be non-negative");
    if (config.maxPointsPerAward <= 0) errors.push("maxPointsPerAward must be positive");

    return {
      validationReportId: `lpe-val-cfg-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: errors.length > 0 ? "fail" : "pass",
      errors,
      warnings: [],
      durationMs: Date.now() - started,
      metadataVersion: LPE_METADATA_VERSION,
    };
  }

  validateEngineRecord(record: LoyaltyEngineRecord): LoyaltyValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.engineId) errors.push("Missing engine ID");
    if (!record.identityEngineConnected) warnings.push("Customer Identity Engine not connected");
    if (!record.crmFoundationConnected) warnings.push("CRM Foundation not connected");

    const decision =
      errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `lpe-val-eng-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: LPE_METADATA_VERSION,
    };
  }
}
