/** X2-10 — Certification Validator. */

import type { PortfolioIntelligenceCertifiedConfiguration } from "./configuration.js";
import { PIC_METADATA_VERSION } from "./paths.js";
import type {
  CertificationActionInput,
  CertificationValidationReport,
  CertifyPortfolioIntelligenceInput,
} from "./types.js";

export class CertificationValidator {
  private base(
    decision: CertificationValidationReport["decision"],
    errors: string[],
    warnings: string[],
    durationMs: number,
  ): CertificationValidationReport {
    return {
      validationReportId: `pic-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs,
      metadataVersion: PIC_METADATA_VERSION,
    };
  }

  validateConfiguration(
    config: PortfolioIntelligenceCertifiedConfiguration,
  ): CertificationValidationReport {
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.safeTestMode) errors.push("safeTestMode must remain true");
    if (!config.neverExposeCredentials) errors.push("neverExposeCredentials must remain true");
    if (!config.neverModifyProductionSystemsUnlessSafeTestMode) {
      errors.push("neverModifyProductionSystemsUnlessSafeTestMode must remain true");
    }
    if (!config.preserveCertificationIntegrity) {
      errors.push("preserveCertificationIntegrity must remain true");
    }
    if (config.passThresholdPercent < 50 || config.passThresholdPercent > 100) {
      warnings.push("passThresholdPercent outside typical 50–100 range");
    }
    return this.base(errors.length ? "fail" : "pass", errors, warnings, 0);
  }

  validateCertify(
    input: CertifyPortfolioIntelligenceInput | CertificationActionInput,
    config: PortfolioIntelligenceCertifiedConfiguration,
  ): CertificationValidationReport {
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.validationRulesEnabled) {
      return this.base("pass", [], ["Validation rules disabled"], 0);
    }
    if (input.validated === false) {
      errors.push("Cannot certify Portfolio Intelligence without validation acknowledgement");
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
    return this.base(errors.length ? "fail" : warnings.length ? "partial" : "pass", errors, warnings, 0);
  }
}
