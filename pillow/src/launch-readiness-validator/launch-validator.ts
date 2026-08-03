/** X1-10 — Launch Validator. */

import { LRV_METADATA_VERSION } from "./paths.js";
import type { LaunchReadinessValidatorConfiguration } from "./configuration.js";
import type {
  LaunchEngineRecord,
  LaunchReadinessRecord,
  LaunchValidationReport,
  ValidateLaunchReadinessInput,
} from "./types.js";

export class LaunchValidator {
  validateConfiguration(config: LaunchReadinessValidatorConfiguration): LaunchValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.enabled) warnings.push("Launch Readiness Validator disabled");
    if (!config.neverExposeCredentials) errors.push("Credential protection must remain enabled");
    if (!config.neverCertifyWithoutValidation) {
      errors.push("Certification without validation prohibition must remain enabled");
    }
    if (!config.structuralSignalsOnly) {
      errors.push("Structural signals only mode must remain enabled");
    }
    if (!config.maskSensitiveValues) errors.push("Sensitive value masking must remain enabled");
    if (config.launchThreshold < 1 || config.launchThreshold > 100) {
      errors.push("launchThreshold must be between 1 and 100");
    }
    if (config.maxReadinessRecordsPerCycle < 1) {
      errors.push("maxReadinessRecordsPerCycle must be >= 1");
    }

    return this.build(errors, warnings, started);
  }

  validateEngineRecord(record: LaunchEngineRecord): LaunchValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.engineRecordId.startsWith("lrv-")) errors.push("Invalid engine record ID prefix");
    if (!record.metadataVersion) errors.push("Missing metadata version");
    for (const [key, present] of Object.entries(record.dependencyPresence)) {
      if (!present) warnings.push(`Dependency not connected: ${key}`);
    }

    return this.build(errors, warnings, started);
  }

  validateLaunchInput(
    input: ValidateLaunchReadinessInput,
    config: LaunchReadinessValidatorConfiguration,
  ): LaunchValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.validationRulesEnabled) {
      return this.build([], ["Validation rules disabled"], started);
    }
    if (input.validated === false) {
      errors.push("Cannot run launch readiness validation without validation acknowledgement");
    }
    if (!config.readinessScoringRulesEnabled) warnings.push("Readiness scoring rules disabled");

    return this.build(errors, warnings, started);
  }

  validateReadinessRecord(record: LaunchReadinessRecord): LaunchValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.launchReadinessId.startsWith("lrv-lrd-")) {
      errors.push("Invalid launch readiness ID prefix");
    }
    if (record.fabricatedLaunchFacts !== false) {
      errors.push("Fabricated launch facts are forbidden");
    }
    if (record.structuralSignalOnly !== true) {
      errors.push("Launch readiness records must remain structural signals only");
    }
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (record.readinessScore < 0 || record.readinessScore > 100) {
      errors.push("Readiness score out of range");
    }
    if (record.launchCertified && record.validationStatus === "failed") {
      errors.push("Cannot certify launch readiness when validation failed");
    }
    if (!record.companyReference) warnings.push("Missing company reference");
    if (!record.businessModelReference) warnings.push("Missing business model reference");

    return this.build(errors, warnings, started);
  }

  private build(
    errors: string[],
    warnings: string[],
    started: number,
  ): LaunchValidationReport {
    return {
      validationReportId: `lrv-val-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      validationTimestamp: new Date().toISOString(),
      decision: errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass",
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: LRV_METADATA_VERSION,
    };
  }
}
