/** X1-08 — Product Portfolio Validator. */

import { PPB_METADATA_VERSION } from "./paths.js";
import type { ProductPortfolioBuilderConfiguration } from "./configuration.js";
import type {
  BuildPortfolioInput,
  ProductPortfolioEngineRecord,
  ProductPortfolioRecord,
  ProductPortfolioValidationReport,
} from "./types.js";

export class ProductPortfolioValidator {
  validateConfiguration(
    config: ProductPortfolioBuilderConfiguration,
  ): ProductPortfolioValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.enabled) warnings.push("Product Portfolio Builder disabled");
    if (!config.neverExposeCredentials) errors.push("Credential protection must remain enabled");
    if (!config.neverAutoPublish) {
      errors.push("Automatic publication prohibition must remain enabled");
    }
    if (!config.structuralSignalsOnly) {
      errors.push("Structural signals only mode must remain enabled");
    }
    if (!config.maskSensitiveValues) errors.push("Sensitive value masking must remain enabled");
    if (config.maxPortfoliosPerCycle < 1) errors.push("maxPortfoliosPerCycle must be >= 1");

    return this.build(errors, warnings, started);
  }

  validateEngineRecord(record: ProductPortfolioEngineRecord): ProductPortfolioValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.engineRecordId.startsWith("ppb-")) errors.push("Invalid engine record ID prefix");
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
    if (!record.dependencyPresence.businessModelGenerator) {
      warnings.push("Business Model Generator dependency not connected");
    }
    if (!record.dependencyPresence.storeGenerationEngine) {
      warnings.push("Store Generation Engine dependency not connected");
    }

    return this.build(errors, warnings, started);
  }

  validateBuildInput(
    input: BuildPortfolioInput,
    config: ProductPortfolioBuilderConfiguration,
  ): ProductPortfolioValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.validationRulesEnabled) {
      return this.build([], ["Validation rules disabled"], started);
    }
    if (input.validated === false) {
      errors.push("Cannot run portfolio generation without validation acknowledgement");
    }
    if (!config.productEvaluationRulesEnabled) warnings.push("Product evaluation rules disabled");
    if (!config.productRankingRulesEnabled) warnings.push("Product ranking rules disabled");
    if (!config.portfolioOptimizationRulesEnabled) {
      warnings.push("Portfolio optimization rules disabled");
    }

    return this.build(errors, warnings, started);
  }

  validatePortfolioRecord(record: ProductPortfolioRecord): ProductPortfolioValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.portfolioId.startsWith("ppb-prt-")) errors.push("Invalid portfolio ID prefix");
    if (record.fabricatedPortfolioFacts !== false) {
      errors.push("Fabricated portfolio facts are forbidden");
    }
    if (record.structuralSignalOnly !== true) {
      errors.push("Portfolio records must remain structural signals only");
    }
    if (record.automaticPublication !== false) {
      errors.push("Automatic publication must remain disabled");
    }
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (!record.productReferences) errors.push("Missing product references");
    if (!record.companyReference) warnings.push("Missing company reference");
    if (!record.businessModelReference) warnings.push("Missing business model reference");
    if (record.portfolioProfitabilityScore < 0 || record.portfolioProfitabilityScore > 100) {
      errors.push("Profitability score out of range");
    }
    if (record.portfolioDemandScore < 0 || record.portfolioDemandScore > 100) {
      errors.push("Demand score out of range");
    }

    return this.build(errors, warnings, started);
  }

  private build(
    errors: string[],
    warnings: string[],
    started: number,
  ): ProductPortfolioValidationReport {
    return {
      validationReportId: `ppb-val-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      validationTimestamp: new Date().toISOString(),
      decision: errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass",
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: PPB_METADATA_VERSION,
    };
  }
}
