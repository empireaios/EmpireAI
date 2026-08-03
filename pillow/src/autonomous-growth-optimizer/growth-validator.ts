/** X3-15 — Growth Validator. */

import { AGO_METADATA_VERSION } from "./paths.js";
import type { AutonomousGrowthOptimizerConfiguration } from "./configuration.js";
import type { GrowthOptimizationInput, GrowthValidationReport } from "./types.js";

const SENSITIVE = /(token|secret|password|credential|api[_-]?key|payroll|ssn|salary)/i;

export class GrowthValidator {
  private report(
    started: number,
    errors: string[],
    warnings: string[],
  ): GrowthValidationReport {
    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";
    return {
      validationReportId: `ago-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: AGO_METADATA_VERSION,
    };
  }

  validateConfiguration(
    config: AutonomousGrowthOptimizerConfiguration,
  ): GrowthValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.enabled) warnings.push("Autonomous Growth Optimizer disabled");
    if (!config.neverOptimizeGrowthBeyondValidatedOperationalLimits) {
      errors.push("Must never optimize growth beyond validated operational limits");
    }
    if (!config.neverExposeCredentials) errors.push("Credential protection must remain enabled");
    if (!config.neverExposeAuthenticationTokens) {
      errors.push("Authentication token protection must remain enabled");
    }
    if (!config.preserveOptimizationTraceability) {
      errors.push("Optimization traceability must remain enabled");
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

  validateGrowthOptimization(
    label: string,
    input: GrowthOptimizationInput,
    config: AutonomousGrowthOptimizerConfiguration,
  ): GrowthValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (input.validated !== true) {
      errors.push(
        `${label} requires validated=true — never optimize growth beyond validated operational limits`,
      );
    }
    if (input.companyReference && SENSITIVE.test(input.companyReference)) {
      errors.push("Company reference must not contain sensitive data");
    }
    if (!config.validationRulesEnabled) warnings.push("Validation rules disabled");
    if (!config.neverOptimizeGrowthBeyondValidatedOperationalLimits) {
      errors.push("Optimizing growth beyond validated operational limits is forbidden");
    }
    return this.report(started, errors, warnings);
  }
}
