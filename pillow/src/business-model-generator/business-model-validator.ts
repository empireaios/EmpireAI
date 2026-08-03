/** X1-04 — Business Model Validator. */

import { BMG_METADATA_VERSION, REVENUE_MODELS } from "./paths.js";
import type { BusinessModelGeneratorConfiguration } from "./configuration.js";
import type {
  BusinessModelEngineRecord,
  BusinessModelRecord,
  BusinessModelValidationReport,
  GenerateBusinessModelInput,
} from "./types.js";

export class BusinessModelValidator {
  validateConfiguration(
    config: BusinessModelGeneratorConfiguration,
  ): BusinessModelValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.enabled) warnings.push("Business Model Generator disabled");
    if (!config.neverFabricateValidationResults) {
      errors.push("Fabrication protection must remain enabled");
    }
    if (!config.structuralSignalsOnly) {
      errors.push("Structural signals only mode must remain enabled");
    }
    if (!config.maskSensitiveValues) errors.push("Sensitive value masking must remain enabled");
    if (config.minBusinessModelScore < 0 || config.minBusinessModelScore > 100) {
      errors.push("Min business model score must be between 0 and 100");
    }

    return this.build(errors, warnings, started);
  }

  validateEngineRecord(record: BusinessModelEngineRecord): BusinessModelValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.engineRecordId.startsWith("bmg-")) errors.push("Invalid engine record ID prefix");
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (!record.dependencyPresence.companyFactoryFramework) {
      warnings.push("Company Factory Framework dependency not connected");
    }
    if (!record.dependencyPresence.businessOpportunityDiscovery) {
      warnings.push("Business Opportunity Discovery dependency not connected");
    }
    if (!record.dependencyPresence.marketValidationEngine) {
      warnings.push("Market Validation Engine dependency not connected");
    }

    return this.build(errors, warnings, started);
  }

  validateGenerateInput(
    input: GenerateBusinessModelInput,
    config: BusinessModelGeneratorConfiguration,
  ): BusinessModelValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.validationRulesEnabled) {
      return this.build([], ["Validation rules disabled"], started);
    }
    if (input.validated === false) {
      errors.push("Cannot run business model generation without validation acknowledgement");
    }
    if (
      input.revenueModel &&
      !(REVENUE_MODELS as readonly string[]).includes(input.revenueModel)
    ) {
      errors.push(`Invalid revenue model: ${input.revenueModel}`);
    }

    return this.build(errors, warnings, started);
  }

  validateBusinessModelRecord(record: BusinessModelRecord): BusinessModelValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.businessModelId.startsWith("bmg-mdl-")) {
      errors.push("Invalid business model ID prefix");
    }
    if (record.fabricatedValidationResults !== false) {
      errors.push("Fabricated validation results are forbidden");
    }
    if (record.structuralSignalOnly !== true) {
      errors.push("Business models must remain structural signals only");
    }
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (!record.opportunityReference) warnings.push("Missing opportunity reference");
    if (!record.revenueModel) warnings.push("Missing revenue model");

    return this.build(errors, warnings, started);
  }

  private build(
    errors: string[],
    warnings: string[],
    started: number,
  ): BusinessModelValidationReport {
    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";
    return {
      validationReportId: `bmg-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: BMG_METADATA_VERSION,
    };
  }
}
