/** X1-09 — Pricing Validator. */

import { PSE_METADATA_VERSION } from "./paths.js";
import type { PricingStrategyEngineConfiguration } from "./configuration.js";
import type {
  GeneratePricingStrategyInput,
  PricingEngineRecord,
  PricingRecord,
  PricingValidationReport,
} from "./types.js";

export class PricingValidator {
  validateConfiguration(config: PricingStrategyEngineConfiguration): PricingValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.enabled) warnings.push("Pricing Strategy Engine disabled");
    if (!config.neverExposeCredentials) errors.push("Credential protection must remain enabled");
    if (!config.neverAutoPublish) {
      errors.push("Automatic publication prohibition must remain enabled");
    }
    if (!config.structuralSignalsOnly) {
      errors.push("Structural signals only mode must remain enabled");
    }
    if (!config.maskSensitiveValues) errors.push("Sensitive value masking must remain enabled");
    if (config.maxPricingRecordsPerCycle < 1) {
      errors.push("maxPricingRecordsPerCycle must be >= 1");
    }

    return this.build(errors, warnings, started);
  }

  validateEngineRecord(record: PricingEngineRecord): PricingValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.engineRecordId.startsWith("pse-")) errors.push("Invalid engine record ID prefix");
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (!record.dependencyPresence.companyFactoryFramework) {
      warnings.push("Company Factory Framework dependency not connected");
    }
    if (!record.dependencyPresence.marketValidationEngine) {
      warnings.push("Market Validation Engine dependency not connected");
    }
    if (!record.dependencyPresence.businessModelGenerator) {
      warnings.push("Business Model Generator dependency not connected");
    }
    if (!record.dependencyPresence.productPortfolioBuilder) {
      warnings.push("Product Portfolio Builder dependency not connected");
    }

    return this.build(errors, warnings, started);
  }

  validateGenerateInput(
    input: GeneratePricingStrategyInput,
    config: PricingStrategyEngineConfiguration,
  ): PricingValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.validationRulesEnabled) {
      return this.build([], ["Validation rules disabled"], started);
    }
    if (input.validated === false) {
      errors.push("Cannot run pricing strategy generation without validation acknowledgement");
    }
    if (!config.priceCalculationRulesEnabled) warnings.push("Price calculation rules disabled");
    if (!config.marginRulesEnabled) warnings.push("Margin rules disabled");
    if (!config.competitorAnalysisRulesEnabled) {
      warnings.push("Competitor analysis rules disabled");
    }

    return this.build(errors, warnings, started);
  }

  validatePricingRecord(record: PricingRecord): PricingValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.pricingRecordId.startsWith("pse-prc-")) {
      errors.push("Invalid pricing record ID prefix");
    }
    if (record.fabricatedPricingFacts !== false) {
      errors.push("Fabricated pricing facts are forbidden");
    }
    if (record.structuralSignalOnly !== true) {
      errors.push("Pricing records must remain structural signals only");
    }
    if (record.automaticPublication !== false) {
      errors.push("Automatic publication must remain disabled");
    }
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (!record.productReference) errors.push("Missing product reference");
    if (!record.companyReference) warnings.push("Missing company reference");
    if (!(record.recommendedSellingPrice > 0)) errors.push("Invalid recommended selling price");
    if (record.estimatedProfitMargin < 0 || record.estimatedProfitMargin > 100) {
      errors.push("Profit margin out of range");
    }
    if (record.competitiveScore < 0 || record.competitiveScore > 100) {
      errors.push("Competitive score out of range");
    }

    return this.build(errors, warnings, started);
  }

  private build(
    errors: string[],
    warnings: string[],
    started: number,
  ): PricingValidationReport {
    return {
      validationReportId: `pse-val-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      validationTimestamp: new Date().toISOString(),
      decision: errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass",
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: PSE_METADATA_VERSION,
    };
  }
}
