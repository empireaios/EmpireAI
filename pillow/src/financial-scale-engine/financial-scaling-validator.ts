/** X3-07 — Financial Scaling Validator. */

import { FSE_METADATA_VERSION } from "./paths.js";
import type { FinancialScaleEngineConfiguration } from "./configuration.js";
import type { FinancialScaleInput, FinancialValidationReport } from "./types.js";

const SENSITIVE = /(token|secret|password|credential|api[_-]?key|bank[_-]?account|iban)/i;

export class FinancialScalingValidator {
  private report(
    started: number,
    errors: string[],
    warnings: string[],
  ): FinancialValidationReport {
    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";
    return {
      validationReportId: `fse-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: FSE_METADATA_VERSION,
    };
  }

  validateConfiguration(config: FinancialScaleEngineConfiguration): FinancialValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.enabled) warnings.push("Financial Scale Engine disabled");
    if (!config.neverRecommendScalingWithoutValidatedFinancialReadiness) {
      errors.push(
        "Must never recommend financial scaling without validated financial readiness",
      );
    }
    if (!config.neverExposeCredentials) errors.push("Credential protection must remain enabled");
    if (!config.neverExposeAuthenticationTokens) {
      errors.push("Authentication token protection must remain enabled");
    }
    if (!config.preserveFinancialTraceability) {
      errors.push("Financial traceability must remain enabled");
    }
    if (!config.preserveFinancialIntegrity) {
      errors.push("Financial integrity must remain enabled");
    }
    if (!config.neverLogSensitiveFinancialInformation) {
      errors.push("Sensitive financial log guard must remain enabled");
    }
    return this.report(started, errors, warnings);
  }

  validateFinancial(
    label: string,
    input: FinancialScaleInput,
    config: FinancialScaleEngineConfiguration,
  ): FinancialValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (input.validated !== true) {
      errors.push(
        `${label} requires validated=true — never recommend scaling without validated financial readiness`,
      );
    }
    if (input.companyReference && SENSITIVE.test(input.companyReference)) {
      errors.push("Company reference must not contain sensitive data");
    }
    if (
      input.scalingInitiativeReference &&
      SENSITIVE.test(input.scalingInitiativeReference)
    ) {
      errors.push("Scaling initiative reference must not contain sensitive data");
    }
    if (!config.validationRulesEnabled) warnings.push("Validation rules disabled");
    if (!config.neverRecommendScalingWithoutValidatedFinancialReadiness) {
      errors.push("Financial scaling without validated readiness is forbidden");
    }
    return this.report(started, errors, warnings);
  }
}
