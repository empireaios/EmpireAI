/** X1-03 — Validation Validator. */

import { MVE_METADATA_VERSION } from "./paths.js";
import type { MarketValidationEngineConfiguration } from "./configuration.js";
import type {
  MarketValidationEngineRecord,
  MarketValidationRecord,
  MarketValidationReport,
  ValidateOpportunityInput,
} from "./types.js";

export class ValidationValidator {
  validateConfiguration(
    config: MarketValidationEngineConfiguration,
  ): MarketValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.enabled) warnings.push("Market Validation Engine disabled");
    if (!config.neverFabricateValidationResults) {
      errors.push("Fabrication protection must remain enabled");
    }
    if (!config.structuralSignalsOnly) {
      errors.push("Structural signals only mode must remain enabled");
    }
    if (!config.maskSensitiveValues) errors.push("Sensitive value masking must remain enabled");
    if (config.minValidationConfidence < 0 || config.minValidationConfidence > 100) {
      errors.push("Min validation confidence must be between 0 and 100");
    }
    if (config.proceedThreshold < config.cautionThreshold) {
      errors.push("Proceed threshold must be greater than or equal to caution threshold");
    }

    return this.build(errors, warnings, started);
  }

  validateEngineRecord(record: MarketValidationEngineRecord): MarketValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.engineRecordId.startsWith("mve-")) errors.push("Invalid engine record ID prefix");
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (!record.dependencyPresence.companyFactoryFramework) {
      warnings.push("Company Factory Framework dependency not connected");
    }
    if (!record.dependencyPresence.businessOpportunityDiscovery) {
      warnings.push("Business Opportunity Discovery dependency not connected");
    }

    return this.build(errors, warnings, started);
  }

  validateOpportunityInput(
    input: ValidateOpportunityInput,
    config: MarketValidationEngineConfiguration,
  ): MarketValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.validationRulesEnabled) {
      return this.build([], ["Validation rules disabled"], started);
    }
    if (input.validated === false) {
      errors.push("Cannot run market validation without validation acknowledgement");
    }

    return this.build(errors, warnings, started);
  }

  validateValidationRecord(record: MarketValidationRecord): MarketValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.validationId.startsWith("mve-vld-")) {
      errors.push("Invalid validation ID prefix");
    }
    if (record.fabricatedValidationResults !== false) {
      errors.push("Fabricated validation results are forbidden");
    }
    if (record.structuralSignalOnly !== true) {
      errors.push("Validations must remain structural signals only");
    }
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (!record.opportunityReference) warnings.push("Missing opportunity reference");
    if (!record.investmentRecommendation) warnings.push("Missing investment recommendation");

    return this.build(errors, warnings, started);
  }

  private build(
    errors: string[],
    warnings: string[],
    started: number,
  ): MarketValidationReport {
    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";
    return {
      validationReportId: `mve-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: MVE_METADATA_VERSION,
    };
  }
}
