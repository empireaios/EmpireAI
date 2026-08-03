/** X2-16 — Optimization Validator. */

import { POE_METADATA_VERSION } from "./paths.js";
import type { PortfolioOptimizationEngineConfiguration } from "./configuration.js";
import type {
  DetectOptimizationOpportunitiesInput,
  GenerateOptimizationRecommendationsInput,
  OptimizationValidationReport,
  OptimizePortfolioInput,
} from "./types.js";

const SENSITIVE = /(token|secret|password|credential|api[_-]?key)/i;

export class OptimizationValidator {
  private report(
    started: number,
    errors: string[],
    warnings: string[],
  ): OptimizationValidationReport {
    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";
    return {
      validationReportId: `poe-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: POE_METADATA_VERSION,
    };
  }

  validateConfiguration(
    config: PortfolioOptimizationEngineConfiguration,
  ): OptimizationValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.enabled) warnings.push("Portfolio Optimization Engine disabled");
    if (!config.neverExecuteOptimizationAutomaticallyBeyondConfiguredApprovalPolicies) {
      errors.push("Automatic optimization beyond approval policies is forbidden");
    }
    if (!config.neverExposeCredentials) {
      errors.push("Credential protection must remain enabled");
    }
    if (!config.neverExposeAuthenticationTokens) {
      errors.push("Authentication token protection must remain enabled");
    }
    if (!config.preserveOptimizationTraceability) {
      errors.push("Optimization traceability must remain enabled");
    }
    if (!config.neverLogSensitiveEnterpriseInformation) {
      errors.push("Sensitive enterprise log guard must remain enabled");
    }
    return this.report(started, errors, warnings);
  }

  validateOptimize(
    input: OptimizePortfolioInput,
    config: PortfolioOptimizationEngineConfiguration,
  ): OptimizationValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (input.validated !== true) {
      errors.push("Optimization analysis requires validated=true");
    }
    if (input.portfolioReference && SENSITIVE.test(input.portfolioReference)) {
      errors.push("Portfolio reference must not contain sensitive data");
    }
    if (!config.optimizationRulesEnabled) warnings.push("Optimization rules disabled");
    if (!config.validationRulesEnabled) warnings.push("Validation rules disabled");
    if (!config.neverExecuteOptimizationAutomaticallyBeyondConfiguredApprovalPolicies) {
      errors.push("Auto-execution beyond approval policies is forbidden");
    }
    return this.report(started, errors, warnings);
  }

  validateDetect(
    input: DetectOptimizationOpportunitiesInput,
    config: PortfolioOptimizationEngineConfiguration,
  ): OptimizationValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (input.validated !== true) {
      errors.push("Opportunity detection requires validated=true");
    }
    if (!config.optimizationRulesEnabled) warnings.push("Optimization rules disabled");
    return this.report(started, errors, warnings);
  }

  validateRecommendations(
    input: GenerateOptimizationRecommendationsInput,
    config: PortfolioOptimizationEngineConfiguration,
  ): OptimizationValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (input.validated !== true) {
      errors.push("Recommendation generation requires validated=true");
    }
    if (!config.recommendationRulesEnabled) {
      warnings.push("Recommendation rules disabled");
    }
    if (!config.neverExecuteOptimizationAutomaticallyBeyondConfiguredApprovalPolicies) {
      errors.push("Auto-execution beyond approval policies is forbidden");
    }
    return this.report(started, errors, warnings);
  }
}
