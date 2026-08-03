/** X2-14 — Forecast Validator. */

import { PFE_METADATA_VERSION } from "./paths.js";
import type { PortfolioForecastEngineConfiguration } from "./configuration.js";
import type {
  ForecastRecord,
  ForecastRequestInput,
  ForecastValidationReport,
  GenerateExecutiveForecastInput,
  GenerateScenariosInput,
} from "./types.js";

const SENSITIVE = /(token|secret|password|credential|api[_-]?key)/i;

export class ForecastValidator {
  private report(
    started: number,
    errors: string[],
    warnings: string[],
  ): ForecastValidationReport {
    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";
    return {
      validationReportId: `pfe-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: PFE_METADATA_VERSION,
    };
  }

  validateConfiguration(
    config: PortfolioForecastEngineConfiguration,
  ): ForecastValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.enabled) warnings.push("Portfolio Forecast Engine disabled");
    if (!config.neverPresentForecastsAsGuaranteedOutcomes) {
      errors.push("Forecasts must never be presented as guaranteed outcomes");
    }
    if (!config.neverExposeCredentials) {
      errors.push("Credential protection must remain enabled");
    }
    if (!config.neverExposeAuthenticationTokens) {
      errors.push("Authentication token protection must remain enabled");
    }
    if (!config.preserveForecastTraceability) {
      errors.push("Forecast traceability must remain enabled");
    }
    if (!config.neverLogSensitiveEnterpriseInformation) {
      errors.push("Sensitive enterprise log guard must remain enabled");
    }
    return this.report(started, errors, warnings);
  }

  validateForecastRequest(
    input: ForecastRequestInput,
    config: PortfolioForecastEngineConfiguration,
  ): ForecastValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (input.validated !== true) {
      errors.push("Forecast generation requires validated=true");
    }
    if (input.portfolioReference && SENSITIVE.test(input.portfolioReference)) {
      errors.push("Portfolio reference must not contain sensitive data");
    }
    if (!config.forecastCalculationRulesEnabled) {
      warnings.push("Forecast calculation rules disabled");
    }
    if (!config.validationRulesEnabled) warnings.push("Validation rules disabled");
    if (!config.neverPresentForecastsAsGuaranteedOutcomes) {
      errors.push("Guaranteed-outcome presentation is forbidden");
    }
    return this.report(started, errors, warnings);
  }

  validateScenarios(
    input: GenerateScenariosInput,
    config: PortfolioForecastEngineConfiguration,
  ): ForecastValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (input.validated !== true) {
      errors.push("Scenario generation requires validated=true");
    }
    if (!config.scenarioGenerationRulesEnabled) {
      warnings.push("Scenario generation rules disabled");
    }
    return this.report(started, errors, warnings);
  }

  validateExecutive(
    input: GenerateExecutiveForecastInput,
    config: PortfolioForecastEngineConfiguration,
  ): ForecastValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (input.validated !== true) {
      errors.push("Executive forecast generation requires validated=true");
    }
    if (!config.forecastCalculationRulesEnabled) {
      warnings.push("Forecast calculation rules disabled");
    }
    return this.report(started, errors, warnings);
  }

  validateRecord(record: ForecastRecord): ForecastValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!record.forecastId.startsWith("pfe-fc-")) {
      errors.push("Forecast ID must use pfe-fc- prefix");
    }
    if (!record.notGuaranteedOutcome) {
      errors.push("Forecast must declare notGuaranteedOutcome");
    }
    if (record.confidenceScore < 0 || record.confidenceScore > 100) {
      errors.push("Confidence score out of range");
    }
    if (record.confidenceScore < 40) {
      warnings.push("Low confidence forecast");
    }
    return this.report(started, errors, warnings);
  }
}
