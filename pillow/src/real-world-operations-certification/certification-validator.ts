/** R5-20 — Certification Validator. */

import { RWOC_METADATA_VERSION } from "./paths.js";
import type { RealWorldOperationsCertificationConfiguration } from "./configuration.js";
import type {
  CertificationValidationReport,
  RealWorldOperationsCertificationReport,
  RunRealWorldOperationsCertificationInput,
} from "./types.js";

export class CertificationValidator {
  validateConfiguration(
    config: RealWorldOperationsCertificationConfiguration,
  ): CertificationValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.enabled) warnings.push("Real World Operations Certification disabled");
    if (!config.requiredValidationRulesEnabled) {
      warnings.push("Required validation rules disabled");
    }
    if (!config.maskSensitiveValues) errors.push("Sensitive value masking must remain enabled");
    if (!config.safeTestMode) errors.push("Safe test mode must remain enabled");
    if (!config.neverModifyProductionOperationsUnlessSafeTestMode) {
      errors.push("Production mutation protection must remain enabled");
    }
    if (config.passThresholdPercent < 0 || config.passThresholdPercent > 100) {
      errors.push("Pass threshold must be between 0 and 100");
    }
    if (config.operationalReadinessThreshold < 0 || config.operationalReadinessThreshold > 100) {
      errors.push("Operational readiness threshold must be between 0 and 100");
    }

    return this.build(errors, warnings, started);
  }

  validateRunInput(
    input: RunRealWorldOperationsCertificationInput,
    config: RealWorldOperationsCertificationConfiguration,
  ): CertificationValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.validationRulesEnabled) {
      return this.build([], ["Validation rules disabled"], started);
    }
    if (config.neverModifyProductionOperationsUnlessSafeTestMode && !config.safeTestMode) {
      errors.push("Cannot run certification without safe test mode");
    }
    if (input.validated === false) {
      errors.push("Cannot run Real World Operations Certification without validation");
    }

    return this.build(errors, warnings, started);
  }

  validateReport(report: RealWorldOperationsCertificationReport): CertificationValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!report.certificationId.startsWith("rwoc-cert-")) {
      errors.push("Invalid certification ID prefix");
    }
    if (report.productionMutationAttempted !== false) {
      errors.push("Certification must not mutate production operations");
    }
    if (!report.metadataVersion) errors.push("Missing metadata version");
    if (report.errors.length > 0) warnings.push(`${report.errors.length} programme error(s) recorded`);

    return this.build(errors, warnings, started);
  }

  private build(
    errors: string[],
    warnings: string[],
    started: number,
  ): CertificationValidationReport {
    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";
    return {
      validationReportId: `rwoc-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: RWOC_METADATA_VERSION,
    };
  }
}
