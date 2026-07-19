/** R5-17 — Experiment Validator. */

import { EXPERIMENT_TYPES, MEE_METADATA_VERSION } from "./paths.js";
import type { MarketingExperimentEngineConfiguration } from "./configuration.js";
import type {
  ArchiveExperimentInput,
  CreateExperimentInput,
  ExperimentEngineRecord,
  ExperimentRecord,
  ExperimentValidationReport,
} from "./types.js";

export class ExperimentValidator {
  validateConfiguration(
    config: MarketingExperimentEngineConfiguration,
  ): ExperimentValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.enabled) warnings.push("Marketing Experiment Engine disabled");
    if (!config.validationRulesEnabled) {
      warnings.push("Validation rules disabled by configuration");
    }
    if (!config.neverDeployWinningVariantsWithoutValidation) {
      errors.push("Winning variant deployment protection must remain enabled");
    }
    if (!config.maskSensitiveValues) {
      errors.push("Sensitive value masking must remain enabled");
    }
    if (config.significanceThreshold <= 0 || config.significanceThreshold > 1) {
      errors.push("Significance threshold must be between 0 and 1");
    }
    if (config.minimumSampleSize <= 0) {
      errors.push("Minimum sample size must be positive");
    }

    return this.build(errors, warnings, started);
  }

  validateEngineRecord(record: ExperimentEngineRecord): ExperimentValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.engineRecordId.startsWith("mee-")) errors.push("Invalid engine record ID prefix");
    if (!record.metadataVersion) errors.push("Missing metadata version");

    const connected = Object.values(record.dependencyPresence).filter(Boolean).length;
    if (connected === 0) warnings.push("No marketing experiment dependencies connected");
    if (!record.dependencyPresence.campaignManager) {
      warnings.push("Campaign Manager dependency not connected");
    }
    if (!record.dependencyPresence.attributionEngine) {
      warnings.push("Attribution Engine dependency not connected");
    }

    return this.build(errors, warnings, started);
  }

  validateCreate(
    input: CreateExperimentInput,
    config: MarketingExperimentEngineConfiguration,
  ): ExperimentValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.validationRulesEnabled) {
      return this.build([], ["Validation rules disabled"], started);
    }
    if (!config.experimentRulesEnabled) {
      errors.push("Experiment rules disabled");
    }
    if (
      input.experimentType !== undefined &&
      !(EXPERIMENT_TYPES as readonly string[]).includes(input.experimentType)
    ) {
      errors.push(`Invalid experiment type: ${input.experimentType}`);
    }
    if (input.variants !== undefined && input.variants.length < 2) {
      errors.push("At least two variants are required");
    }
    if (config.neverDeployWinningVariantsWithoutValidation && input.validated === false) {
      errors.push("Cannot create production-deployed experiments without validation");
    }

    return this.build(errors, warnings, started);
  }

  validateArchive(
    input: ArchiveExperimentInput,
    config: MarketingExperimentEngineConfiguration,
  ): ExperimentValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.validationRulesEnabled) {
      return this.build([], ["Validation rules disabled"], started);
    }
    if (config.neverDeployWinningVariantsWithoutValidation && input.validated === false) {
      errors.push("Cannot archive and deploy winning variants without validation");
    }

    return this.build(errors, warnings, started);
  }

  validateExperimentRecord(record: ExperimentRecord): ExperimentValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.experimentId.startsWith("mee-exp-")) {
      errors.push("Invalid experiment ID prefix");
    }
    if (!record.experimentName.trim()) errors.push("Experiment name is required");
    if (record.variantReferences.length < 2) {
      errors.push("Experiment must include at least two variants");
    }
    if (record.deployedToProduction !== false) {
      errors.push("Winning variants must not deploy to production without validation gate");
    }
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (record.statisticallySignificant) {
      warnings.push("Statistical significance detected");
    }

    return this.build(errors, warnings, started);
  }

  private build(
    errors: string[],
    warnings: string[],
    started: number,
  ): ExperimentValidationReport {
    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";
    return {
      validationReportId: `mee-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: MEE_METADATA_VERSION,
    };
  }
}
