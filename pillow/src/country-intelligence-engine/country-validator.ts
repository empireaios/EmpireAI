/** X4-02 — Country Validator. */

import { CIE_METADATA_VERSION } from "./paths.js";
import type { CountryIntelligenceEngineConfiguration } from "./configuration.js";
import type { CountryEvaluationInput, CountryValidationReport } from "./types.js";

const SENSITIVE = /(token|secret|password|credential|api[_-]?key)/i;

export class CountryValidator {
  private report(
    started: number,
    errors: string[],
    warnings: string[],
  ): CountryValidationReport {
    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";
    return {
      validationReportId: `cie-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: CIE_METADATA_VERSION,
    };
  }

  validateConfiguration(
    config: CountryIntelligenceEngineConfiguration,
  ): CountryValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.enabled) warnings.push("Country Intelligence Engine disabled");
    if (!config.neverRecommendUsingUnvalidatedCountryData) {
      errors.push("Unvalidated country recommendations must remain forbidden");
    }
    if (!config.neverExposeCredentials) errors.push("Credential protection must remain enabled");
    if (!config.neverExposeAuthenticationTokens) {
      errors.push("Authentication token protection must remain enabled");
    }
    if (!config.preserveEvaluationTraceability) {
      errors.push("Evaluation traceability must remain enabled");
    }
    if (!config.preserveEnterpriseIntegrity) {
      errors.push("Enterprise integrity must remain enabled");
    }
    if (!config.structuralSignalsOnly) {
      errors.push("Structural signals only must remain enabled");
    }
    if (!config.neverLogSensitiveOperationalInformation) {
      errors.push("Sensitive operational log guard must remain enabled");
    }
    return this.report(started, errors, warnings);
  }

  validateEvaluation(
    label: string,
    input: CountryEvaluationInput,
    config: CountryIntelligenceEngineConfiguration,
  ): CountryValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (input.validated !== true) {
      errors.push(`${label} requires validated=true`);
    }
    if (input.country && SENSITIVE.test(input.country)) {
      errors.push("Country reference must not contain sensitive data");
    }
    if (!config.evaluationRulesEnabled) {
      warnings.push("Evaluation rules disabled");
    }
    if (!config.neverRecommendUsingUnvalidatedCountryData) {
      errors.push("Unvalidated country recommendations are forbidden");
    }
    if (!config.validationRulesEnabled) warnings.push("Validation rules disabled");
    return this.report(started, errors, warnings);
  }
}
