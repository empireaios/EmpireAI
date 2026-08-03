/** X2-15 — Acquisition Validator. */

import { AEE_METADATA_VERSION } from "./paths.js";
import type { AcquisitionEvaluationEngineConfiguration } from "./configuration.js";
import type {
  AcquisitionRecord,
  AcquisitionValidationReport,
  DiscoverAcquisitionCandidatesInput,
  EvaluateAcquisitionInput,
  GenerateAcquisitionRecommendationsInput,
} from "./types.js";

const SENSITIVE = /(token|secret|password|credential|api[_-]?key)/i;

export class AcquisitionValidator {
  private report(
    started: number,
    errors: string[],
    warnings: string[],
  ): AcquisitionValidationReport {
    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";
    return {
      validationReportId: `aee-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: AEE_METADATA_VERSION,
    };
  }

  validateConfiguration(
    config: AcquisitionEvaluationEngineConfiguration,
  ): AcquisitionValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.enabled) warnings.push("Acquisition Evaluation Engine disabled");
    if (!config.neverRecommendUsingUnvalidatedInformation) {
      errors.push("Unvalidated acquisition recommendations are forbidden");
    }
    if (!config.neverExposeCredentials) {
      errors.push("Credential protection must remain enabled");
    }
    if (!config.neverExposeAuthenticationTokens) {
      errors.push("Authentication token protection must remain enabled");
    }
    if (!config.preserveEvaluationTraceability) {
      errors.push("Evaluation traceability must remain enabled");
    }
    if (!config.neverLogSensitiveEnterpriseInformation) {
      errors.push("Sensitive enterprise log guard must remain enabled");
    }
    return this.report(started, errors, warnings);
  }

  validateDiscover(
    input: DiscoverAcquisitionCandidatesInput,
    config: AcquisitionEvaluationEngineConfiguration,
  ): AcquisitionValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (input.validated !== true) {
      errors.push("Candidate discovery requires validated=true");
    }
    for (const name of input.candidateBusinesses ?? []) {
      if (SENSITIVE.test(name)) errors.push("Candidate business must not contain sensitive data");
    }
    if (!config.candidateDiscoveryRulesEnabled) {
      warnings.push("Candidate discovery rules disabled");
    }
    return this.report(started, errors, warnings);
  }

  validateEvaluate(
    input: EvaluateAcquisitionInput,
    config: AcquisitionEvaluationEngineConfiguration,
  ): AcquisitionValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!input.candidateBusiness?.trim()) errors.push("Missing candidate business");
    if (SENSITIVE.test(input.candidateBusiness ?? "")) {
      errors.push("Candidate business must not contain sensitive data");
    }
    if (input.validated !== true) {
      errors.push("Acquisition evaluation requires validated=true");
    }
    if (!config.evaluationRulesEnabled) warnings.push("Evaluation rules disabled");
    if (!config.validationRulesEnabled) warnings.push("Validation rules disabled");
    if (!config.neverRecommendUsingUnvalidatedInformation) {
      errors.push("Unvalidated recommendation path is forbidden");
    }
    return this.report(started, errors, warnings);
  }

  validateRecommendations(
    input: GenerateAcquisitionRecommendationsInput,
    config: AcquisitionEvaluationEngineConfiguration,
  ): AcquisitionValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (input.validated !== true) {
      errors.push("Recommendation generation requires validated=true");
    }
    if (!config.neverRecommendUsingUnvalidatedInformation) {
      errors.push("Unvalidated acquisition recommendations are forbidden");
    }
    return this.report(started, errors, warnings);
  }

  validateRecord(record: AcquisitionRecord): AcquisitionValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!record.candidateBusiness.trim()) errors.push("Record missing candidate business");
    if (!record.validatedInformationOnly) {
      errors.push("Records must be validated-information-only");
    }
    if (record.strategicFitScore < 0 || record.strategicFitScore > 100) {
      errors.push("Strategic fit score out of range");
    }
    return this.report(started, errors, warnings);
  }
}
