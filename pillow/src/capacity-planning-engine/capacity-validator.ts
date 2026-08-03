/** X3-04 — Capacity Validator. */

import { CPE_METADATA_VERSION } from "./paths.js";
import type { CapacityPlanningEngineConfiguration } from "./configuration.js";
import type { CapacityPlanningInput, CapacityValidationReport } from "./types.js";

const SENSITIVE = /(token|secret|password|credential|api[_-]?key)/i;

export class CapacityValidator {
  private report(
    started: number,
    errors: string[],
    warnings: string[],
  ): CapacityValidationReport {
    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";
    return {
      validationReportId: `cpe-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: CPE_METADATA_VERSION,
    };
  }

  validateConfiguration(config: CapacityPlanningEngineConfiguration): CapacityValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.enabled) warnings.push("Capacity Planning Engine disabled");
    if (!config.neverRecommendBeyondValidatedLimits) {
      errors.push("Must never recommend scaling beyond validated capacity limits");
    }
    if (!config.neverExposeCredentials) errors.push("Credential protection must remain enabled");
    if (!config.neverExposeAuthenticationTokens) {
      errors.push("Authentication token protection must remain enabled");
    }
    if (!config.preservePlanningTraceability) {
      errors.push("Planning traceability must remain enabled");
    }
    if (!config.preserveEnterpriseIntegrity) {
      errors.push("Enterprise integrity must remain enabled");
    }
    if (!config.neverLogSensitiveOperationalInformation) {
      errors.push("Sensitive operational log guard must remain enabled");
    }
    return this.report(started, errors, warnings);
  }

  validatePlanning(
    label: string,
    input: CapacityPlanningInput,
    config: CapacityPlanningEngineConfiguration,
  ): CapacityValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (input.validated !== true) {
      errors.push(
        `${label} requires validated=true — never recommend beyond validated capacity limits`,
      );
    }
    if (input.companyReference && SENSITIVE.test(input.companyReference)) {
      errors.push("Company reference must not contain sensitive data");
    }
    if (input.productReference && SENSITIVE.test(input.productReference)) {
      errors.push("Product reference must not contain sensitive data");
    }
    if (!config.validationRulesEnabled) warnings.push("Validation rules disabled");
    if (!config.neverRecommendBeyondValidatedLimits) {
      errors.push("Recommendations beyond validated limits are forbidden");
    }
    return this.report(started, errors, warnings);
  }
}
