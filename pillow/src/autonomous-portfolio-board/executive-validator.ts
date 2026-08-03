/** X2-20 — Executive Validator. */

import { APB_METADATA_VERSION } from "./paths.js";
import type { AutonomousPortfolioBoardConfiguration } from "./configuration.js";
import type {
  GenerateExecutiveRecommendationsInput,
  PrioritizeExecutiveDecisionsInput,
  ReviewAcquisitionOpportunitiesInput,
  ReviewCapitalAllocationInput,
  ReviewEnterprisePerformanceInput,
  ReviewEnterpriseRisksInput,
  ReviewExpansionOpportunitiesInput,
  ReviewPortfolioHealthInput,
  ReviewStrategicOpportunitiesInput,
  ExecutiveValidationReport,
} from "./types.js";

const SENSITIVE = /(token|secret|password|credential|api[_-]?key|bank[_-]?account|account[_-]?number)/i;

export class ExecutiveValidator {
  private report(
    started: number,
    errors: string[],
    warnings: string[],
  ): ExecutiveValidationReport {
    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";
    return {
      validationReportId: `apb-vrpt-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: APB_METADATA_VERSION,
    };
  }

  validateConfiguration(
    config: AutonomousPortfolioBoardConfiguration,
  ): ExecutiveValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.enabled) warnings.push("Autonomous Portfolio Board disabled");
    if (!config.neverExecuteStrategicDecisionsAutomaticallyBeyondConfiguredApprovalPolicies) {
      errors.push(
        "Strategic decisions must never execute automatically beyond configured approval policies",
      );
    }
    if (!config.neverExposeCredentials) {
      errors.push("Credential protection must remain enabled");
    }
    if (!config.neverExposeAuthenticationTokens) {
      errors.push("Authentication token protection must remain enabled");
    }
    if (!config.preserveExecutiveDecisionTraceability) {
      errors.push("Executive decision traceability must remain enabled");
    }
    if (!config.preserveEnterpriseGovernanceIntegrity) {
      errors.push("Enterprise governance integrity must remain enabled");
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

  private validateReview(
    label: string,
    input: { portfolioReference?: string; validated?: boolean },
    config: AutonomousPortfolioBoardConfiguration,
  ): ExecutiveValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (input.validated !== true) {
      errors.push(`${label} requires validated=true`);
    }
    errors.push(...this.validatePortfolioReference(input.portfolioReference));
    if (!config.executiveDecisionRulesEnabled) {
      warnings.push("Executive decision rules disabled");
    }
    if (!config.validationRulesEnabled) warnings.push("Validation rules disabled");
    if (!config.neverExecuteStrategicDecisionsAutomaticallyBeyondConfiguredApprovalPolicies) {
      errors.push("Automatic strategic execution is forbidden");
    }
    return this.report(started, errors, warnings);
  }

  validatePerformanceReview(
    input: ReviewEnterprisePerformanceInput,
    config: AutonomousPortfolioBoardConfiguration,
  ): ExecutiveValidationReport {
    return this.validateReview("Enterprise performance review", input, config);
  }

  validateHealthReview(
    input: ReviewPortfolioHealthInput,
    config: AutonomousPortfolioBoardConfiguration,
  ): ExecutiveValidationReport {
    return this.validateReview("Portfolio health review", input, config);
  }

  validateOpportunityReview(
    input: ReviewStrategicOpportunitiesInput,
    config: AutonomousPortfolioBoardConfiguration,
  ): ExecutiveValidationReport {
    return this.validateReview("Strategic opportunity review", input, config);
  }

  validateRiskReview(
    input: ReviewEnterpriseRisksInput,
    config: AutonomousPortfolioBoardConfiguration,
  ): ExecutiveValidationReport {
    return this.validateReview("Enterprise risk review", input, config);
  }

  validateCapitalReview(
    input: ReviewCapitalAllocationInput,
    config: AutonomousPortfolioBoardConfiguration,
  ): ExecutiveValidationReport {
    return this.validateReview("Capital allocation review", input, config);
  }

  validateExpansionReview(
    input: ReviewExpansionOpportunitiesInput,
    config: AutonomousPortfolioBoardConfiguration,
  ): ExecutiveValidationReport {
    return this.validateReview("Expansion opportunity review", input, config);
  }

  validateAcquisitionReview(
    input: ReviewAcquisitionOpportunitiesInput,
    config: AutonomousPortfolioBoardConfiguration,
  ): ExecutiveValidationReport {
    return this.validateReview("Acquisition opportunity review", input, config);
  }

  validatePrioritization(
    input: PrioritizeExecutiveDecisionsInput,
    config: AutonomousPortfolioBoardConfiguration,
  ): ExecutiveValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (input.validated !== true) {
      errors.push("Executive prioritization requires validated=true");
    }
    errors.push(...this.validatePortfolioReference(input.portfolioReference));
    if (!config.strategicPrioritizationRulesEnabled) {
      warnings.push("Strategic prioritization rules disabled");
    }
    return this.report(started, errors, warnings);
  }

  validateRecommendations(
    input: GenerateExecutiveRecommendationsInput,
    config: AutonomousPortfolioBoardConfiguration,
  ): ExecutiveValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (input.validated !== true) {
      errors.push("Executive recommendation generation requires validated=true");
    }
    errors.push(...this.validatePortfolioReference(input.portfolioReference));
    if (!config.neverExecuteStrategicDecisionsAutomaticallyBeyondConfiguredApprovalPolicies) {
      errors.push("Recommendations must not auto-execute strategic decisions");
    }
    warnings.push("All recommendations carry autoExecutionBlocked=true");
    return this.report(started, errors, warnings);
  }
}
