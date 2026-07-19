/** R4-12 — Loyalty validation engine. */

import { LPE_METADATA_VERSION } from "./paths.js";
import type { LoyaltyProgrammeEngineConfiguration } from "./configuration.js";
import type { LoyaltyRecord, LoyaltyValidationReport } from "./types.js";

export class LoyaltyValidationEngine {
  validateLoyaltyRecord(
    record: LoyaltyRecord,
    config: LoyaltyProgrammeEngineConfiguration,
  ): LoyaltyValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.loyaltyRecordId) errors.push("Missing loyalty record ID");
    if (!record.customerId) errors.push("Missing customer ID");
    if (!record.loyaltyProgrammeId) errors.push("Missing loyalty programme ID");
    if (record.currentPointsBalance < 0) errors.push("Points balance cannot be negative");
    if (record.pointsEarned < 0 || record.pointsRedeemed < 0) {
      errors.push("Points earned/redeemed cannot be negative");
    }

    if (config.validationRulesEnabled && record.validationStatus === "failed") {
      warnings.push("Loyalty record validation failed");
    }

    const decision =
      errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `lpe-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: LPE_METADATA_VERSION,
    };
  }
}
