/** X3-16 — Revenue Validator. */

import { RAE_METADATA_VERSION } from "./paths.js";
import type { RevenueAccelerationEngineConfiguration } from "./configuration.js";
import type { RevenueAccelerationInput, RevenueValidationReport } from "./types.js";

const SENSITIVE = /(token|secret|password|credential|api[_-]?key|payroll|ssn|salary|bank|iban)/i;

export class RevenueValidator {
  private report(
    started: number,
    errors: string[],
    warnings: string[],
  ): RevenueValidationReport {
    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";
    return {
      validationReportId: `rae-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: RAE_METADATA_VERSION,
    };
  }

  validateConfiguration(
    config: RevenueAccelerationEngineConfiguration,
  ): RevenueValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.enabled) warnings.push("Revenue Acceleration Engine disabled");
    if (!config.neverRecommendRevenueActionsWithoutValidatedSupportingData) {
      errors.push("Must never recommend revenue actions without validated supporting data");
    }
    if (!config.neverExposeCredentials) errors.push("Credential protection must remain enabled");
    if (!config.neverExposeAuthenticationTokens) {
      errors.push("Authentication token protection must remain enabled");
    }
    if (!config.preserveRevenueTraceability) {
      errors.push("Revenue traceability must remain enabled");
    }
    if (!config.preserveEnterpriseIntegrity) {
      errors.push("Enterprise integrity must remain enabled");
    }
    if (!config.structuralSignalsOnly) {
      errors.push("Structural signals only must remain enabled");
    }
    if (!config.neverLogSensitiveFinancialInformation) {
      errors.push("Sensitive financial log guard must remain enabled");
    }
    return this.report(started, errors, warnings);
  }

  validateRevenueAcceleration(
    label: string,
    input: RevenueAccelerationInput,
    config: RevenueAccelerationEngineConfiguration,
  ): RevenueValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (input.validated !== true) {
      errors.push(
        `${label} requires validated=true — never recommend revenue actions without validated supporting data`,
      );
    }
    if (input.companyReference && SENSITIVE.test(input.companyReference)) {
      errors.push("Company reference must not contain sensitive data");
    }
    if (!config.validationRulesEnabled) warnings.push("Validation rules disabled");
    if (!config.neverRecommendRevenueActionsWithoutValidatedSupportingData) {
      errors.push("Recommending revenue actions without validated supporting data is forbidden");
    }
    return this.report(started, errors, warnings);
  }
}
