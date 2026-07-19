/** R4-17 — Journey validator. */

import { CJI_METADATA_VERSION } from "./paths.js";
import type { CustomerJourneyIntelligenceConfiguration } from "./configuration.js";
import type {
  JourneyIntelligenceEngineRecord,
  JourneyRecord,
  JourneyValidationReport,
} from "./types.js";

export class JourneyValidator {
  validateConfiguration(
    config: CustomerJourneyIntelligenceConfiguration,
  ): JourneyValidationReport {
    const started = Date.now();
    const errors: string[] = [];

    if (config.maxRetryAttempts < 0) errors.push("maxRetryAttempts must be non-negative");
    if (config.dropOffInactivityDays < 1) errors.push("dropOffInactivityDays must be at least 1");

    return {
      validationReportId: `cji-val-cfg-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: errors.length > 0 ? "fail" : "pass",
      errors,
      warnings: [],
      durationMs: Date.now() - started,
      metadataVersion: CJI_METADATA_VERSION,
    };
  }

  validateEngineRecord(record: JourneyIntelligenceEngineRecord): JourneyValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.engineId) errors.push("Missing engine ID");
    if (!record.timelineEngineConnected) warnings.push("Customer Timeline Engine not connected");

    const decision =
      errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `cji-val-eng-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: CJI_METADATA_VERSION,
    };
  }
}

export class JourneyValidationEngine {
  validateJourneyRecord(
    record: JourneyRecord,
    config: CustomerJourneyIntelligenceConfiguration,
  ): JourneyValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.customerId?.trim()) errors.push("Customer ID is required");
    if (record.journeyScore < 0 || record.journeyScore > 100) {
      errors.push("Journey score must be between 0 and 100");
    }
    if (record.touchpointReferences.length === 0) {
      warnings.push("No touchpoint references mapped");
    }
    if (!config.validationRulesEnabled) {
      warnings.push("Validation rules disabled — partial validation only");
    }

    const decision =
      errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `cji-val-rec-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: CJI_METADATA_VERSION,
    };
  }
}
