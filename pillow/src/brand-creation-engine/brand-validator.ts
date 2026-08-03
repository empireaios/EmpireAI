/** X1-05 — Brand Validator. */

import { BCE_METADATA_VERSION } from "./paths.js";
import type { BrandCreationEngineConfiguration } from "./configuration.js";
import type {
  BrandEngineRecord,
  BrandRecord,
  BrandValidationReport,
  CreateBrandInput,
} from "./types.js";

export class BrandValidator {
  validateConfiguration(config: BrandCreationEngineConfiguration): BrandValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.enabled) warnings.push("Brand Creation Engine disabled");
    if (!config.neverExposeCredentials) errors.push("Credential protection must remain enabled");
    if (!config.preventDuplicateBrandIdentities) {
      errors.push("Duplicate identity prevention must remain enabled");
    }
    if (!config.structuralSignalsOnly) {
      errors.push("Structural signals only mode must remain enabled");
    }
    if (!config.maskSensitiveValues) errors.push("Sensitive value masking must remain enabled");
    if (config.maxBrandsPerCycle < 1) errors.push("maxBrandsPerCycle must be >= 1");

    return this.build(errors, warnings, started);
  }

  validateEngineRecord(record: BrandEngineRecord): BrandValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.engineRecordId.startsWith("bce-")) errors.push("Invalid engine record ID prefix");
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

    return this.build(errors, warnings, started);
  }

  validateCreateInput(
    input: CreateBrandInput,
    config: BrandCreationEngineConfiguration,
  ): BrandValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.validationRulesEnabled) {
      return this.build([], ["Validation rules disabled"], started);
    }
    if (input.validated === false) {
      errors.push("Cannot run brand creation without validation acknowledgement");
    }
    if (!config.namingRulesEnabled) warnings.push("Naming rules disabled");
    if (!config.identityGenerationRulesEnabled) warnings.push("Identity generation rules disabled");

    return this.build(errors, warnings, started);
  }

  validateBrandRecord(record: BrandRecord): BrandValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.brandId.startsWith("bce-brd-")) errors.push("Invalid brand ID prefix");
    if (record.fabricatedBrandFacts !== false) {
      errors.push("Fabricated brand facts are forbidden");
    }
    if (record.structuralSignalOnly !== true) {
      errors.push("Brand records must remain structural signals only");
    }
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (!record.companyName) errors.push("Missing company name");
    if (!record.brandIdentity) errors.push("Missing brand identity");
    if (!record.businessModelReference) warnings.push("Missing business model reference");
    if (!record.brandGuidelineReference) warnings.push("Missing brand guideline reference");

    return this.build(errors, warnings, started);
  }

  private build(
    errors: string[],
    warnings: string[],
    started: number,
  ): BrandValidationReport {
    return {
      validationReportId: `bce-val-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      validationTimestamp: new Date().toISOString(),
      decision: errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass",
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: BCE_METADATA_VERSION,
    };
  }
}
