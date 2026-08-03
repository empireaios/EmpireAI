/** X3-19 — Balance Validator. */

import { SBE_METADATA_VERSION } from "./paths.js";
import type { SelfBalancingEnterpriseConfiguration } from "./configuration.js";
import type { SelfBalancingInput, BalanceValidationReport } from "./types.js";

const SENSITIVE = /(token|secret|password|credential|api[_-]?key|payroll|ssn|salary|bank|iban)/i;

export class BalanceValidator {
  private report(
    started: number,
    errors: string[],
    warnings: string[],
  ): BalanceValidationReport {
    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";
    return {
      validationReportId: `sbe-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: SBE_METADATA_VERSION,
    };
  }

  validateConfiguration(
    config: SelfBalancingEnterpriseConfiguration,
  ): BalanceValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.enabled) warnings.push("Self-Balancing Enterprise disabled");
    if (!config.neverReallocateProtectedResourcesBeyondApprovalPolicies) {
      errors.push("Must never reallocate protected resources beyond approval policies");
    }
    if (!config.neverExposeCredentials) errors.push("Credential protection must remain enabled");
    if (!config.neverExposeAuthenticationTokens) {
      errors.push("Authentication token protection must remain enabled");
    }
    if (!config.preserveBalancingTraceability) {
      errors.push("Balancing traceability must remain enabled");
    }
    if (!config.preserveEnterpriseIntegrity) {
      errors.push("Enterprise integrity must remain enabled");
    }
    if (!config.structuralSignalsOnly) {
      errors.push("Structural signals only must remain enabled");
    }
    if (!config.neverLogSensitiveEnterpriseInformation) {
      errors.push("Sensitive enterprise log guard must remain enabled");
    }
    return this.report(started, errors, warnings);
  }

  validateBalancing(
    label: string,
    input: SelfBalancingInput,
    config: SelfBalancingEnterpriseConfiguration,
  ): BalanceValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (input.validated !== true) {
      errors.push(
        `${label} requires validated=true — never reallocate protected resources beyond approval policies`,
      );
    }
    if (input.bypassApprovalPolicies === true) {
      errors.push(
        `${label} refused — never reallocate protected resources beyond approval policies`,
      );
    }
    if (input.mutateProductionResources === true) {
      errors.push(
        `${label} refused — structural balancing records only; no production resource mutation`,
      );
    }
    if (input.companyReference && SENSITIVE.test(input.companyReference)) {
      errors.push("Company reference must not contain sensitive data");
    }
    if (!config.validationRulesEnabled) warnings.push("Validation rules disabled");
    if (!config.neverReallocateProtectedResourcesBeyondApprovalPolicies) {
      errors.push("Reallocating protected resources beyond approval policies is forbidden");
    }
    return this.report(started, errors, warnings);
  }
}
