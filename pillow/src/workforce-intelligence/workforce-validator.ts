/** X3-08 — Workforce Validator. */

import { WFI_METADATA_VERSION } from "./paths.js";
import type { WorkforceIntelligenceConfiguration } from "./configuration.js";
import type { WorkforceIntelligenceInput, WorkforceValidationReport } from "./types.js";

const SENSITIVE = /(token|secret|password|credential|api[_-]?key|payroll|ssn|salary)/i;

export class WorkforceValidator {
  private report(
    started: number,
    errors: string[],
    warnings: string[],
  ): WorkforceValidationReport {
    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";
    return {
      validationReportId: `wfi-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: WFI_METADATA_VERSION,
    };
  }

  validateConfiguration(
    config: WorkforceIntelligenceConfiguration,
  ): WorkforceValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.enabled) warnings.push("Workforce Intelligence disabled");
    if (!config.neverOverloadWorkforceBeyondValidatedLimits) {
      errors.push(
        "Must never overload AI workforce beyond validated limits",
      );
    }
    if (!config.neverExposeCredentials) errors.push("Credential protection must remain enabled");
    if (!config.neverExposeAuthenticationTokens) {
      errors.push("Authentication token protection must remain enabled");
    }
    if (!config.preserveWorkforceTraceability) {
      errors.push("Workforce traceability must remain enabled");
    }
    if (!config.preserveEnterpriseIntegrity) {
      errors.push("Enterprise integrity must remain enabled");
    }
    if (!config.neverLogSensitiveOperationalInformation) {
      errors.push("Sensitive operational log guard must remain enabled");
    }
    return this.report(started, errors, warnings);
  }

  validateWorkforce(
    label: string,
    input: WorkforceIntelligenceInput,
    config: WorkforceIntelligenceConfiguration,
  ): WorkforceValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (input.validated !== true) {
      errors.push(
        `${label} requires validated=true — never overload workforce beyond validated limits`,
      );
    }
    if (input.companyReference && SENSITIVE.test(input.companyReference)) {
      errors.push("Company reference must not contain sensitive data");
    }
    if (input.workforceReference && SENSITIVE.test(input.workforceReference)) {
      errors.push("Workforce reference must not contain sensitive data");
    }
    if (!config.validationRulesEnabled) warnings.push("Validation rules disabled");
    if (!config.neverOverloadWorkforceBeyondValidatedLimits) {
      errors.push("Workforce overload beyond validated limits is forbidden");
    }
    return this.report(started, errors, warnings);
  }
}
