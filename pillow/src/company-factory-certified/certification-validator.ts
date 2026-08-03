/** X1-15 — Certification Validator. */

import { CFC_METADATA_VERSION } from "./paths.js";
import type { CompanyFactoryCertifiedConfiguration } from "./configuration.js";
import type {
  CertificationEngineRecord,
  CertificationValidationReport,
  CertifyCompanyFactoryInput,
  CompanyFactoryCertificationReport,
} from "./types.js";

export class CertificationValidator {
  validateConfiguration(
    config: CompanyFactoryCertifiedConfiguration,
  ): CertificationValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.enabled) warnings.push("Company Factory Certified disabled");
    if (!config.neverExposeCredentials) errors.push("Credential protection must remain enabled");
    if (!config.neverModifyProductionSystemsUnlessSafeTestMode) {
      errors.push("Production modification guard must remain enabled");
    }
    if (!config.safeTestMode) errors.push("Safe test mode must remain enabled");
    if (!config.structuralSignalsOnly) {
      errors.push("Structural signals only mode must remain enabled");
    }
    if (!config.maskSensitiveValues) errors.push("Sensitive value masking must remain enabled");
    if (config.passThresholdPercent < 1 || config.passThresholdPercent > 100) {
      errors.push("passThresholdPercent must be between 1 and 100");
    }
    if (config.maxCertificationsPerCycle < 1) {
      errors.push("maxCertificationsPerCycle must be >= 1");
    }
    if (config.certificationScope.length === 0) {
      warnings.push("Certification scope is empty");
    }

    return this.build(errors, warnings, started);
  }

  validateEngineRecord(record: CertificationEngineRecord): CertificationValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.engineRecordId.startsWith("cfc-")) errors.push("Invalid engine record ID prefix");
    if (!record.metadataVersion) errors.push("Missing metadata version");
    for (const [key, present] of Object.entries(record.dependencyPresence)) {
      if (!present) warnings.push(`Dependency not connected: ${key}`);
    }

    return this.build(errors, warnings, started);
  }

  validateCertifyInput(
    input: CertifyCompanyFactoryInput,
    config: CompanyFactoryCertifiedConfiguration,
  ): CertificationValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.validationRulesEnabled) {
      return this.build([], ["Validation rules disabled"], started);
    }
    if (input.validated === false) {
      errors.push("Cannot certify Company Factory without validation acknowledgement");
    }
    if (!config.requiredValidationRulesEnabled) {
      warnings.push("Required validation rules disabled");
    }
    if (!config.endToEndValidationEnabled) {
      warnings.push("End-to-end validation disabled");
    }
    if (!config.safeTestMode) {
      errors.push("Certification requires safe test mode");
    }

    return this.build(errors, warnings, started);
  }

  validateCertificationReport(
    record: CompanyFactoryCertificationReport,
  ): CertificationValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.certificationId.startsWith("cfc-crt-")) {
      errors.push("Invalid certification ID prefix");
    }
    if (record.fabricatedCertificationFacts !== false) {
      errors.push("Fabricated certification facts are forbidden");
    }
    if (record.structuralSignalOnly !== true) {
      errors.push("Certification records must remain structural signals only");
    }
    if (record.modifiedProductionSystemsWithoutSafeTestMode !== false) {
      errors.push("Production system modification outside safe test mode is forbidden");
    }
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (record.perModulePassFailStatus.length === 0) {
      warnings.push("No per-module certification results");
    }
    if (record.overallCertificationStatus === "failed") {
      warnings.push("Overall certification status is failed");
    }

    return this.build(errors, warnings, started);
  }

  private build(
    errors: string[],
    warnings: string[],
    started: number,
  ): CertificationValidationReport {
    return {
      validationReportId: `cfc-val-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      validationTimestamp: new Date().toISOString(),
      decision: errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass",
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: CFC_METADATA_VERSION,
    };
  }
}
