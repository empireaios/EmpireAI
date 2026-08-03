/** X3-03 — Decision Validator. */

import { SDE_METADATA_VERSION } from "./paths.js";
import type { ScalingDecisionEngineConfiguration } from "./configuration.js";
import type { DecisionValidationReport, ScalingDecisionInput } from "./types.js";

const SENSITIVE = /(token|secret|password|credential|api[_-]?key)/i;

export class DecisionValidator {
  private report(
    started: number,
    errors: string[],
    warnings: string[],
  ): DecisionValidationReport {
    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";
    return {
      validationReportId: `sde-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: SDE_METADATA_VERSION,
    };
  }

  validateConfiguration(config: ScalingDecisionEngineConfiguration): DecisionValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.enabled) warnings.push("Scaling Decision Engine disabled");
    if (!config.neverApproveScalingWithoutValidation) {
      errors.push("Scaling must never be approved without validation");
    }
    if (!config.neverExposeCredentials) errors.push("Credential protection must remain enabled");
    if (!config.neverExposeAuthenticationTokens) {
      errors.push("Authentication token protection must remain enabled");
    }
    if (!config.preserveDecisionTraceability) {
      errors.push("Decision traceability must remain enabled");
    }
    if (!config.preserveEnterpriseIntegrity) {
      errors.push("Enterprise integrity must remain enabled");
    }
    if (!config.neverLogSensitiveOperationalInformation) {
      errors.push("Sensitive operational log guard must remain enabled");
    }
    return this.report(started, errors, warnings);
  }

  validateDecision(
    label: string,
    input: ScalingDecisionInput,
    config: ScalingDecisionEngineConfiguration,
  ): DecisionValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (input.validated !== true) {
      errors.push(`${label} requires validated=true — never approve scaling without validation`);
    }
    if (input.companyReference && SENSITIVE.test(input.companyReference)) {
      errors.push("Company reference must not contain sensitive data");
    }
    if (input.productReference && SENSITIVE.test(input.productReference)) {
      errors.push("Product reference must not contain sensitive data");
    }
    if (!config.decisionRulesEnabled) warnings.push("Decision rules disabled");
    if (!config.neverApproveScalingWithoutValidation) {
      errors.push("Scaling approval without validation is forbidden");
    }
    if (!config.validationRulesEnabled) warnings.push("Validation rules disabled");
    return this.report(started, errors, warnings);
  }
}
