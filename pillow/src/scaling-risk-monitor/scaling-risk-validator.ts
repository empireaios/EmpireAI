/** X3-13 — Scaling Risk Validator. */

import { SRM_METADATA_VERSION } from "./paths.js";
import type { ScalingRiskMonitorConfiguration } from "./configuration.js";
import type { ScalingRiskInput, ScalingRiskValidationReport } from "./types.js";

const SENSITIVE = /(token|secret|password|credential|api[_-]?key|payroll|ssn|salary)/i;

export class ScalingRiskValidator {
  private report(
    started: number,
    errors: string[],
    warnings: string[],
  ): ScalingRiskValidationReport {
    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";
    return {
      validationReportId: `srm-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: SRM_METADATA_VERSION,
    };
  }

  validateConfiguration(
    config: ScalingRiskMonitorConfiguration,
  ): ScalingRiskValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.enabled) warnings.push("Scaling Risk Monitor disabled");
    if (!config.neverSuppressCriticalScalingRisks) {
      errors.push("Must never suppress critical scaling risks");
    }
    if (!config.neverExposeCredentials) errors.push("Credential protection must remain enabled");
    if (!config.neverExposeAuthenticationTokens) {
      errors.push("Authentication token protection must remain enabled");
    }
    if (!config.preserveRiskTraceability) {
      errors.push("Risk traceability must remain enabled");
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

  validateScalingRisk(
    label: string,
    input: ScalingRiskInput,
    config: ScalingRiskMonitorConfiguration,
  ): ScalingRiskValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (input.validated !== true) {
      errors.push(
        `${label} requires validated=true — never suppress critical scaling risks`,
      );
    }
    if (input.companyReference && SENSITIVE.test(input.companyReference)) {
      errors.push("Company reference must not contain sensitive data");
    }
    if (!config.validationRulesEnabled) warnings.push("Validation rules disabled");
    if (!config.neverSuppressCriticalScalingRisks) {
      errors.push("Suppressing critical scaling risks is forbidden");
    }
    return this.report(started, errors, warnings);
  }
}
