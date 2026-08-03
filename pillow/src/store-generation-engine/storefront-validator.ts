/** X1-07 — Storefront Validator. */

import { SGE_METADATA_VERSION } from "./paths.js";
import type { StoreGenerationEngineConfiguration } from "./configuration.js";
import type {
  GenerateStorefrontInput,
  StorefrontEngineRecord,
  StorefrontRecord,
  StorefrontValidationReport,
} from "./types.js";

export class StorefrontValidator {
  validateConfiguration(config: StoreGenerationEngineConfiguration): StorefrontValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.enabled) warnings.push("Store Generation Engine disabled");
    if (!config.neverExposeCredentials) errors.push("Credential protection must remain enabled");
    if (!config.neverAutoDeploy) errors.push("Automatic deployment prohibition must remain enabled");
    if (!config.structuralSignalsOnly) {
      errors.push("Structural signals only mode must remain enabled");
    }
    if (!config.maskSensitiveValues) errors.push("Sensitive value masking must remain enabled");
    if (config.maxStorefrontsPerCycle < 1) errors.push("maxStorefrontsPerCycle must be >= 1");

    return this.build(errors, warnings, started);
  }

  validateEngineRecord(record: StorefrontEngineRecord): StorefrontValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.engineRecordId.startsWith("sge-")) errors.push("Invalid engine record ID prefix");
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (!record.dependencyPresence.companyFactoryFramework) {
      warnings.push("Company Factory Framework dependency not connected");
    }
    if (!record.dependencyPresence.businessModelGenerator) {
      warnings.push("Business Model Generator dependency not connected");
    }
    if (!record.dependencyPresence.brandCreationEngine) {
      warnings.push("Brand Creation Engine dependency not connected");
    }
    if (!record.dependencyPresence.domainDigitalAssetPlanner) {
      warnings.push("Domain & Digital Asset Planner dependency not connected");
    }

    return this.build(errors, warnings, started);
  }

  validateGenerateInput(
    input: GenerateStorefrontInput,
    config: StoreGenerationEngineConfiguration,
  ): StorefrontValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.validationRulesEnabled) {
      return this.build([], ["Validation rules disabled"], started);
    }
    if (input.validated === false) {
      errors.push("Cannot run storefront generation without validation acknowledgement");
    }
    if (!config.websiteGenerationRulesEnabled) warnings.push("Website generation rules disabled");
    if (!config.navigationRulesEnabled) warnings.push("Navigation rules disabled");
    if (!config.deploymentPreparationRulesEnabled) {
      warnings.push("Deployment preparation rules disabled");
    }

    return this.build(errors, warnings, started);
  }

  validateStorefrontRecord(record: StorefrontRecord): StorefrontValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.storefrontId.startsWith("sge-sft-")) errors.push("Invalid storefront ID prefix");
    if (record.fabricatedStorefrontFacts !== false) {
      errors.push("Fabricated storefront facts are forbidden");
    }
    if (record.structuralSignalOnly !== true) {
      errors.push("Storefront records must remain structural signals only");
    }
    if (record.automaticDeployment !== false) {
      errors.push("Automatic deployment must remain disabled");
    }
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (!record.websiteStructureReference) errors.push("Missing website structure reference");
    if (!record.companyReference) warnings.push("Missing company reference");
    if (!record.brandReference) warnings.push("Missing brand reference");
    if (!record.domainPlanReference) warnings.push("Missing domain plan reference");
    if (!record.deploymentPackageReference) warnings.push("Missing deployment package reference");

    return this.build(errors, warnings, started);
  }

  private build(
    errors: string[],
    warnings: string[],
    started: number,
  ): StorefrontValidationReport {
    return {
      validationReportId: `sge-val-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      validationTimestamp: new Date().toISOString(),
      decision: errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass",
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: SGE_METADATA_VERSION,
    };
  }
}
