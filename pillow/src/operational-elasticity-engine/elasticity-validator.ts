/** X3-11 — Elasticity Validator. */

import { OEE_METADATA_VERSION } from "./paths.js";
import type { OperationalElasticityEngineConfiguration } from "./configuration.js";
import type { OperationalElasticityInput, ElasticityValidationReport } from "./types.js";

const SENSITIVE = /(token|secret|password|credential|api[_-]?key|payroll|ssn|salary)/i;

export class ElasticityValidator {
  private report(
    started: number,
    errors: string[],
    warnings: string[],
  ): ElasticityValidationReport {
    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";
    return {
      validationReportId: `oee-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: OEE_METADATA_VERSION,
    };
  }

  validateConfiguration(
    config: OperationalElasticityEngineConfiguration,
  ): ElasticityValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.enabled) warnings.push("Operational Elasticity Engine disabled");
    if (!config.neverExceedValidatedOperationalLimits) {
      errors.push("Must never exceed validated operational limits");
    }
    if (!config.neverExposeCredentials) errors.push("Credential protection must remain enabled");
    if (!config.neverExposeAuthenticationTokens) {
      errors.push("Authentication token protection must remain enabled");
    }
    if (!config.preserveElasticityTraceability) {
      errors.push("Elasticity traceability must remain enabled");
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

  validateElasticity(
    label: string,
    input: OperationalElasticityInput,
    config: OperationalElasticityEngineConfiguration,
  ): ElasticityValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (input.validated !== true) {
      errors.push(
        `${label} requires validated=true — never exceed validated operational limits`,
      );
    }
    if (input.companyReference && SENSITIVE.test(input.companyReference)) {
      errors.push("Company reference must not contain sensitive data");
    }
    if (input.operationalComponent && SENSITIVE.test(input.operationalComponent)) {
      errors.push("Operational component must not contain sensitive data");
    }
    if (!config.validationRulesEnabled) warnings.push("Validation rules disabled");
    if (!config.neverExceedValidatedOperationalLimits) {
      errors.push("Exceeding validated operational limits is forbidden");
    }
    return this.report(started, errors, warnings);
  }
}
