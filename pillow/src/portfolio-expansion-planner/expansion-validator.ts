/** X2-18 — Expansion Validator. */

import { PEP_METADATA_VERSION } from "./paths.js";
import type { PortfolioExpansionPlannerConfiguration } from "./configuration.js";
import type {
  EvaluateExpansionInput,
  ExpansionValidationReport,
  GenerateExpansionRecommendationsInput,
  IdentifyExpansionOpportunitiesInput,
  PrioritizeExpansionsInput,
  EstimateExpansionCostsInput,
  EstimateExpansionReturnsInput,
} from "./types.js";

const SENSITIVE = /(token|secret|password|credential|api[_-]?key)/i;

export class ExpansionValidator {
  private report(
    started: number,
    errors: string[],
    warnings: string[],
  ): ExpansionValidationReport {
    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";
    return {
      validationReportId: `pep-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: PEP_METADATA_VERSION,
    };
  }

  validateConfiguration(
    config: PortfolioExpansionPlannerConfiguration,
  ): ExpansionValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.enabled) warnings.push("Portfolio Expansion Planner disabled");
    if (!config.neverInitiateExpansionAutomaticallyBeyondConfiguredApprovalPolicies) {
      errors.push("Automatic expansion initiation beyond approval policies is forbidden");
    }
    if (!config.neverExposeCredentials) {
      errors.push("Credential protection must remain enabled");
    }
    if (!config.neverExposeAuthenticationTokens) {
      errors.push("Authentication token protection must remain enabled");
    }
    if (!config.preserveExpansionTraceability) {
      errors.push("Expansion traceability must remain enabled");
    }
    if (!config.neverLogSensitiveEnterpriseInformation) {
      errors.push("Sensitive enterprise log guard must remain enabled");
    }
    return this.report(started, errors, warnings);
  }

  validatePortfolioReference(portfolioReference?: string): string[] {
    const errors: string[] = [];
    if (portfolioReference && SENSITIVE.test(portfolioReference)) {
      errors.push("Portfolio reference must not contain sensitive data");
    }
    return errors;
  }

  validateIdentify(
    input: IdentifyExpansionOpportunitiesInput,
    config: PortfolioExpansionPlannerConfiguration,
  ): ExpansionValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (input.validated !== true) {
      errors.push("Opportunity identification requires validated=true");
    }
    errors.push(...this.validatePortfolioReference(input.portfolioReference));
    if (!config.expansionEvaluationRulesEnabled) {
      warnings.push("Expansion evaluation rules disabled");
    }
    if (!config.validationRulesEnabled) warnings.push("Validation rules disabled");
    return this.report(started, errors, warnings);
  }

  validateEvaluate(
    input: EvaluateExpansionInput,
    config: PortfolioExpansionPlannerConfiguration,
  ): ExpansionValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (input.validated !== true) {
      errors.push("Expansion evaluation requires validated=true");
    }
    errors.push(...this.validatePortfolioReference(input.portfolioReference));
    if (input.opportunityHint && SENSITIVE.test(input.opportunityHint)) {
      errors.push("Opportunity hint must not contain sensitive data");
    }
    if (!config.expansionEvaluationRulesEnabled) {
      warnings.push("Expansion evaluation rules disabled");
    }
    if (!config.neverInitiateExpansionAutomaticallyBeyondConfiguredApprovalPolicies) {
      errors.push("Auto-initiation beyond approval policies is forbidden");
    }
    return this.report(started, errors, warnings);
  }

  validatePrioritize(
    input: PrioritizeExpansionsInput,
    config: PortfolioExpansionPlannerConfiguration,
  ): ExpansionValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (input.validated !== true) {
      errors.push("Expansion prioritization requires validated=true");
    }
    errors.push(...this.validatePortfolioReference(input.portfolioReference));
    if (!config.prioritizationRulesEnabled) {
      errors.push("Prioritization rules disabled");
    }
    return this.report(started, errors, warnings);
  }

  validateEstimateCosts(
    input: EstimateExpansionCostsInput,
    config: PortfolioExpansionPlannerConfiguration,
  ): ExpansionValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (input.validated !== true) {
      errors.push("Cost estimation requires validated=true");
    }
    errors.push(...this.validatePortfolioReference(input.portfolioReference));
    if (!config.expansionEvaluationRulesEnabled) {
      warnings.push("Expansion evaluation rules disabled");
    }
    return this.report(started, errors, warnings);
  }

  validateEstimateReturns(
    input: EstimateExpansionReturnsInput,
    config: PortfolioExpansionPlannerConfiguration,
  ): ExpansionValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (input.validated !== true) {
      errors.push("Return estimation requires validated=true");
    }
    errors.push(...this.validatePortfolioReference(input.portfolioReference));
    if (!config.expansionEvaluationRulesEnabled) {
      warnings.push("Expansion evaluation rules disabled");
    }
    return this.report(started, errors, warnings);
  }

  validateRecommendations(
    input: GenerateExpansionRecommendationsInput,
    config: PortfolioExpansionPlannerConfiguration,
  ): ExpansionValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (input.validated !== true) {
      errors.push("Recommendation generation requires validated=true");
    }
    errors.push(...this.validatePortfolioReference(input.portfolioReference));
    if (!config.neverInitiateExpansionAutomaticallyBeyondConfiguredApprovalPolicies) {
      errors.push("Auto-initiation beyond approval policies is forbidden");
    }
    return this.report(started, errors, warnings);
  }
}
