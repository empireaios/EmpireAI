/** X3-09 — Dashboard Validator. */

import { ESD_METADATA_VERSION } from "./paths.js";
import type { ExecutiveScalingDashboardConfiguration } from "./configuration.js";
import type {
  ExecutiveDashboardValidationReport,
  ExecutiveScalingDashboardInput,
} from "./types.js";

const SENSITIVE =
  /(token|secret|password|credential|api[_-]?key|payroll|ssn|salary|restricted)/i;

export class DashboardValidator {
  private report(
    started: number,
    errors: string[],
    warnings: string[],
  ): ExecutiveDashboardValidationReport {
    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";
    return {
      validationReportId: `esd-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: ESD_METADATA_VERSION,
    };
  }

  validateConfiguration(
    config: ExecutiveScalingDashboardConfiguration,
  ): ExecutiveDashboardValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.enabled) warnings.push("Executive Scaling Dashboard disabled");
    if (!config.neverExposeCredentials) errors.push("Credential protection must remain enabled");
    if (!config.neverExposeAuthenticationTokens) {
      errors.push("Authentication token protection must remain enabled");
    }
    if (!config.neverExposeRestrictedEnterpriseInformation) {
      errors.push("Restricted enterprise information protection must remain enabled");
    }
    if (!config.preserveDashboardTraceability) {
      errors.push("Dashboard traceability must remain enabled");
    }
    if (!config.preserveEnterpriseIntegrity) {
      errors.push("Enterprise integrity must remain enabled");
    }
    if (!config.neverLogSensitiveEnterpriseInformation) {
      errors.push("Sensitive enterprise log guard must remain enabled");
    }
    if (!config.structuralSignalsOnly) {
      errors.push("Structural signals only must remain enabled");
    }
    return this.report(started, errors, warnings);
  }

  validateDashboard(
    label: string,
    input: ExecutiveScalingDashboardInput,
    config: ExecutiveScalingDashboardConfiguration,
  ): ExecutiveDashboardValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (input.validated !== true) {
      errors.push(
        `${label} requires validated=true — never expose restricted enterprise information`,
      );
    }
    if (input.companyReference && SENSITIVE.test(input.companyReference)) {
      errors.push("Company reference must not contain sensitive data");
    }
    if (!config.validationRulesEnabled) warnings.push("Validation rules disabled");
    if (!config.neverExposeRestrictedEnterpriseInformation) {
      errors.push("Restricted enterprise information exposure is forbidden");
    }
    return this.report(started, errors, warnings);
  }
}
