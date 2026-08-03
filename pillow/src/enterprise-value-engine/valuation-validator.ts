/** X2-19 — Valuation Validator. */

import { EVE_METADATA_VERSION } from "./paths.js";
import type { EnterpriseValueEngineConfiguration } from "./configuration.js";
import type {
  CalculateCompanyValuationInput,
  CalculateEnterpriseValueInput,
  CalculatePortfolioValuationInput,
  DetectValuationAnomaliesInput,
  EstimateIntrinsicValueInput,
  EstimateMarketValueInput,
  GenerateValuationRecommendationsInput,
  MeasureValueGrowthInput,
  TrackValuationHistoryInput,
  ValuationValidationReport,
} from "./types.js";

const SENSITIVE = /(token|secret|password|credential|api[_-]?key|bank[_-]?account|account[_-]?number)/i;

export class ValuationValidator {
  private report(
    started: number,
    errors: string[],
    warnings: string[],
  ): ValuationValidationReport {
    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";
    return {
      validationReportId: `eve-vrpt-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: EVE_METADATA_VERSION,
    };
  }

  validateConfiguration(config: EnterpriseValueEngineConfiguration): ValuationValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.enabled) warnings.push("Enterprise Value Engine disabled");
    if (!config.neverRepresentEstimatedValuesAsGuaranteedMarketPrices) {
      errors.push("Estimated values must never be represented as guaranteed market prices");
    }
    if (!config.neverExposeCredentials) {
      errors.push("Credential protection must remain enabled");
    }
    if (!config.neverExposeAuthenticationTokens) {
      errors.push("Authentication token protection must remain enabled");
    }
    if (!config.preserveValuationTraceability) {
      errors.push("Valuation traceability must remain enabled");
    }
    if (!config.preserveFinancialIntegrity) {
      errors.push("Financial integrity preservation must remain enabled");
    }
    if (!config.neverLogSensitiveFinancialInformation) {
      errors.push("Sensitive financial log guard must remain enabled");
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

  validateCompanyReference(companyReference?: string | null): string[] {
    const errors: string[] = [];
    if (companyReference && SENSITIVE.test(companyReference)) {
      errors.push("Company reference must not contain sensitive data");
    }
    return errors;
  }

  validateEnterpriseValue(
    input: CalculateEnterpriseValueInput,
    config: EnterpriseValueEngineConfiguration,
  ): ValuationValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (input.validated !== true) {
      errors.push("Enterprise value calculation requires validated=true");
    }
    errors.push(...this.validatePortfolioReference(input.portfolioReference));
    errors.push(...this.validateCompanyReference(input.companyReference));
    if (!config.valuationRulesEnabled) {
      warnings.push("Valuation rules disabled");
    }
    if (!config.neverRepresentEstimatedValuesAsGuaranteedMarketPrices) {
      errors.push("Guaranteed market price representation is forbidden");
    }
    if (!config.validationRulesEnabled) warnings.push("Validation rules disabled");
    return this.report(started, errors, warnings);
  }

  validateCompanyValuation(
    input: CalculateCompanyValuationInput,
    config: EnterpriseValueEngineConfiguration,
  ): ValuationValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (input.validated !== true) {
      errors.push("Company valuation requires validated=true");
    }
    if (!input.companyReference?.trim()) {
      errors.push("Company reference required for company valuation");
    }
    errors.push(...this.validatePortfolioReference(input.portfolioReference));
    errors.push(...this.validateCompanyReference(input.companyReference));
    if (!config.valuationRulesEnabled) warnings.push("Valuation rules disabled");
    return this.report(started, errors, warnings);
  }

  validatePortfolioValuation(
    input: CalculatePortfolioValuationInput,
    config: EnterpriseValueEngineConfiguration,
  ): ValuationValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (input.validated !== true) {
      errors.push("Portfolio valuation requires validated=true");
    }
    errors.push(...this.validatePortfolioReference(input.portfolioReference));
    if (!config.valuationRulesEnabled) warnings.push("Valuation rules disabled");
    return this.report(started, errors, warnings);
  }

  validateIntrinsic(
    input: EstimateIntrinsicValueInput,
    config: EnterpriseValueEngineConfiguration,
  ): ValuationValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (input.validated !== true) {
      errors.push("Intrinsic value estimation requires validated=true");
    }
    errors.push(...this.validatePortfolioReference(input.portfolioReference));
    errors.push(...this.validateCompanyReference(input.companyReference));
    if (!config.neverRepresentEstimatedValuesAsGuaranteedMarketPrices) {
      errors.push("Intrinsic estimates must not be represented as guaranteed market prices");
    }
    return this.report(started, errors, warnings);
  }

  validateMarket(
    input: EstimateMarketValueInput,
    config: EnterpriseValueEngineConfiguration,
  ): ValuationValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (input.validated !== true) {
      errors.push("Market value estimation requires validated=true");
    }
    errors.push(...this.validatePortfolioReference(input.portfolioReference));
    errors.push(...this.validateCompanyReference(input.companyReference));
    if (!config.neverRepresentEstimatedValuesAsGuaranteedMarketPrices) {
      errors.push("Market estimates must not be represented as guaranteed market prices");
    }
    warnings.push("Market value estimates are structural signals only — not guaranteed market prices");
    return this.report(started, errors, warnings);
  }

  validateValueGrowth(
    input: MeasureValueGrowthInput,
    config: EnterpriseValueEngineConfiguration,
  ): ValuationValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (input.validated !== true) {
      errors.push("Value growth measurement requires validated=true");
    }
    errors.push(...this.validatePortfolioReference(input.portfolioReference));
    errors.push(...this.validateCompanyReference(input.companyReference));
    if (!config.valuationRulesEnabled) warnings.push("Valuation rules disabled");
    return this.report(started, errors, warnings);
  }

  validateTrackHistory(
    input: TrackValuationHistoryInput,
    config: EnterpriseValueEngineConfiguration,
  ): ValuationValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (input.validated !== true) {
      errors.push("Valuation history tracking requires validated=true");
    }
    errors.push(...this.validatePortfolioReference(input.portfolioReference));
    errors.push(...this.validateCompanyReference(input.companyReference));
    if (!config.preserveValuationTraceability) {
      errors.push("Valuation traceability must remain enabled");
    }
    return this.report(started, errors, warnings);
  }

  validateAnomalies(
    input: DetectValuationAnomaliesInput,
    config: EnterpriseValueEngineConfiguration,
  ): ValuationValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (input.validated !== true) {
      errors.push("Anomaly detection requires validated=true");
    }
    errors.push(...this.validatePortfolioReference(input.portfolioReference));
    errors.push(...this.validateCompanyReference(input.companyReference));
    if (!config.healthMonitoringRulesEnabled) {
      warnings.push("Health monitoring rules disabled");
    }
    return this.report(started, errors, warnings);
  }

  validateRecommendations(
    input: GenerateValuationRecommendationsInput,
    config: EnterpriseValueEngineConfiguration,
  ): ValuationValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (input.validated !== true) {
      errors.push("Recommendation generation requires validated=true");
    }
    errors.push(...this.validatePortfolioReference(input.portfolioReference));
    errors.push(...this.validateCompanyReference(input.companyReference));
    if (!config.neverRepresentEstimatedValuesAsGuaranteedMarketPrices) {
      errors.push("Recommendations must not represent estimated values as guaranteed market prices");
    }
    warnings.push("All recommendations carry notGuaranteedMarketPrice=true");
    return this.report(started, errors, warnings);
  }
}
