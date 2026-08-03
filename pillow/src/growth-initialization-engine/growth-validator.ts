/** X1-12 — Growth Validator. */

import { GIE_METADATA_VERSION } from "./paths.js";
import type { GrowthInitializationEngineConfiguration } from "./configuration.js";
import type {
  GrowthEngineRecord,
  GrowthPlanRecord,
  GrowthValidationReport,
  InitializeGrowthPlanInput,
} from "./types.js";

export class GrowthValidator {
  validateConfiguration(
    config: GrowthInitializationEngineConfiguration,
  ): GrowthValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.enabled) warnings.push("Growth Initialization Engine disabled");
    if (!config.neverExposeCredentials) errors.push("Credential protection must remain enabled");
    if (!config.neverModifyOperationalConfigWithoutValidation) {
      errors.push("Operational config modification without validation must remain prohibited");
    }
    if (!config.structuralSignalsOnly) {
      errors.push("Structural signals only mode must remain enabled");
    }
    if (!config.maskSensitiveValues) errors.push("Sensitive value masking must remain enabled");
    if (config.maxPlansPerCycle < 1) errors.push("maxPlansPerCycle must be >= 1");

    return this.build(errors, warnings, started);
  }

  validateEngineRecord(record: GrowthEngineRecord): GrowthValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.engineRecordId.startsWith("gie-")) errors.push("Invalid engine record ID prefix");
    if (!record.metadataVersion) errors.push("Missing metadata version");
    for (const [key, present] of Object.entries(record.dependencyPresence)) {
      if (!present) warnings.push(`Dependency not connected: ${key}`);
    }

    return this.build(errors, warnings, started);
  }

  validateInitializeInput(
    input: InitializeGrowthPlanInput,
    config: GrowthInitializationEngineConfiguration,
  ): GrowthValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.validationRulesEnabled) {
      return this.build([], ["Validation rules disabled"], started);
    }
    if (input.validated === false) {
      errors.push("Cannot initialize growth plan without validation acknowledgement");
    }
    if (!config.growthPlanningRulesEnabled) warnings.push("Growth planning rules disabled");
    if (!config.revenueMilestoneRulesEnabled) warnings.push("Revenue milestone rules disabled");
    if (!config.recommendationRulesEnabled) warnings.push("Recommendation rules disabled");

    return this.build(errors, warnings, started);
  }

  validateGrowthRecord(record: GrowthPlanRecord): GrowthValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.growthPlanId.startsWith("gie-pln-")) errors.push("Invalid growth plan ID prefix");
    if (record.fabricatedGrowthFacts !== false) {
      errors.push("Fabricated growth facts are forbidden");
    }
    if (record.structuralSignalOnly !== true) {
      errors.push("Growth records must remain structural signals only");
    }
    if (record.modifiedOperationalConfigWithoutValidation !== false) {
      errors.push("Operational config modification without validation is forbidden");
    }
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (record.growthScore < 0 || record.growthScore > 100) {
      errors.push("Growth score out of range");
    }
    if (!record.companyReference) warnings.push("Missing company reference");
    if (!record.launchReference) warnings.push("Missing launch reference");
    if (!record.growthObjectives) warnings.push("Missing growth objectives");

    return this.build(errors, warnings, started);
  }

  private build(
    errors: string[],
    warnings: string[],
    started: number,
  ): GrowthValidationReport {
    return {
      validationReportId: `gie-val-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      validationTimestamp: new Date().toISOString(),
      decision: errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass",
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: GIE_METADATA_VERSION,
    };
  }
}
