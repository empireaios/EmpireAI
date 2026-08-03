/** X3-12 — Preservation Validator. */

import { PPE_METADATA_VERSION } from "./paths.js";
import type { PerformancePreservationEngineConfiguration } from "./configuration.js";
import type { PerformancePreservationInput, PreservationValidationReport } from "./types.js";

const SENSITIVE = /(token|secret|password|credential|api[_-]?key|payroll|ssn|salary)/i;

export class PreservationValidator {
  private report(
    started: number,
    errors: string[],
    warnings: string[],
  ): PreservationValidationReport {
    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";
    return {
      validationReportId: `ppe-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: PPE_METADATA_VERSION,
    };
  }

  validateConfiguration(
    config: PerformancePreservationEngineConfiguration,
  ): PreservationValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.enabled) warnings.push("Performance Preservation Engine disabled");
    if (!config.neverCompromiseCustomerExperienceForScaling) {
      errors.push("Must never compromise customer experience for scaling");
    }
    if (!config.neverExposeCredentials) errors.push("Credential protection must remain enabled");
    if (!config.neverExposeAuthenticationTokens) {
      errors.push("Authentication token protection must remain enabled");
    }
    if (!config.preserveQualityTraceability) {
      errors.push("Quality traceability must remain enabled");
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

  validatePreservation(
    label: string,
    input: PerformancePreservationInput,
    config: PerformancePreservationEngineConfiguration,
  ): PreservationValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (input.validated !== true) {
      errors.push(
        `${label} requires validated=true — never compromise customer experience for scaling`,
      );
    }
    if (input.companyReference && SENSITIVE.test(input.companyReference)) {
      errors.push("Company reference must not contain sensitive data");
    }
    if (input.operationalComponent && SENSITIVE.test(input.operationalComponent)) {
      errors.push("Operational component must not contain sensitive data");
    }
    if (!config.validationRulesEnabled) warnings.push("Validation rules disabled");
    if (!config.neverCompromiseCustomerExperienceForScaling) {
      errors.push("Compromising customer experience for scaling is forbidden");
    }
    return this.report(started, errors, warnings);
  }
}
