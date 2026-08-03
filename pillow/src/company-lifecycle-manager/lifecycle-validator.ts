/** X2-17 — Lifecycle Validator. */

import { CLM_METADATA_VERSION } from "./paths.js";
import type { CompanyLifecycleManagerConfiguration } from "./configuration.js";
import type {
  AssessMaturityInput,
  DetectTransitionsInput,
  GenerateLifecycleRecommendationsInput,
  LifecycleValidationReport,
  ManageLifecycleStageInput,
  ManageStageActionInput,
} from "./types.js";

const SENSITIVE = /(token|secret|password|credential|api[_-]?key)/i;

export class LifecycleValidator {
  private report(
    started: number,
    errors: string[],
    warnings: string[],
  ): LifecycleValidationReport {
    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";
    return {
      validationReportId: `clm-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: CLM_METADATA_VERSION,
    };
  }

  validateConfiguration(
    config: CompanyLifecycleManagerConfiguration,
  ): LifecycleValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.enabled) warnings.push("Company Lifecycle Manager disabled");
    if (!config.neverTransitionLifecycleStagesAutomaticallyBeyondConfiguredApprovalPolicies) {
      errors.push("Automatic lifecycle transitions beyond approval policies are forbidden");
    }
    if (!config.neverExposeCredentials) {
      errors.push("Credential protection must remain enabled");
    }
    if (!config.neverExposeAuthenticationTokens) {
      errors.push("Authentication token protection must remain enabled");
    }
    if (!config.preserveLifecycleTraceability) {
      errors.push("Lifecycle traceability must remain enabled");
    }
    if (!config.neverLogSensitiveEnterpriseInformation) {
      errors.push("Sensitive enterprise log guard must remain enabled");
    }
    return this.report(started, errors, warnings);
  }

  validateManage(
    input: ManageLifecycleStageInput | ManageStageActionInput | AssessMaturityInput,
    config: CompanyLifecycleManagerConfiguration,
  ): LifecycleValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!input.companyReference?.trim()) errors.push("Missing company reference");
    if (SENSITIVE.test(input.companyReference ?? "")) {
      errors.push("Company reference must not contain sensitive data");
    }
    if (input.validated !== true) {
      errors.push("Lifecycle management requires validated=true");
    }
    if (!config.validationRulesEnabled) warnings.push("Validation rules disabled");
    if (!config.neverTransitionLifecycleStagesAutomaticallyBeyondConfiguredApprovalPolicies) {
      errors.push("Auto-transition beyond approval policies is forbidden");
    }
    return this.report(started, errors, warnings);
  }

  validateDetect(
    input: DetectTransitionsInput,
    config: CompanyLifecycleManagerConfiguration,
  ): LifecycleValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (input.validated !== true) {
      errors.push("Transition detection requires validated=true");
    }
    if (!config.lifecycleTransitionRulesEnabled) {
      warnings.push("Lifecycle transition rules disabled");
    }
    return this.report(started, errors, warnings);
  }

  validateRecommendations(
    input: GenerateLifecycleRecommendationsInput,
    config: CompanyLifecycleManagerConfiguration,
  ): LifecycleValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (input.validated !== true) {
      errors.push("Recommendation generation requires validated=true");
    }
    if (!config.neverTransitionLifecycleStagesAutomaticallyBeyondConfiguredApprovalPolicies) {
      errors.push("Auto-transition beyond approval policies is forbidden");
    }
    return this.report(started, errors, warnings);
  }
}
