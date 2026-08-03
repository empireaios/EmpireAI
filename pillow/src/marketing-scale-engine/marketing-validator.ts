/** X3-05 — Marketing Validator. */

import { MSE_METADATA_VERSION } from "./paths.js";
import type { MarketingScaleEngineConfiguration } from "./configuration.js";
import type { MarketingScaleInput, MarketingValidationReport } from "./types.js";

const SENSITIVE = /(token|secret|password|credential|api[_-]?key)/i;

export class MarketingValidator {
  private report(
    started: number,
    errors: string[],
    warnings: string[],
  ): MarketingValidationReport {
    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";
    return {
      validationReportId: `mse-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: MSE_METADATA_VERSION,
    };
  }

  validateConfiguration(config: MarketingScaleEngineConfiguration): MarketingValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.enabled) warnings.push("Marketing Scale Engine disabled");
    if (!config.neverRecommendMarketingExpansionWithoutValidatedPerformance) {
      errors.push(
        "Must never recommend marketing expansion without validated performance",
      );
    }
    if (!config.neverExposeCredentials) errors.push("Credential protection must remain enabled");
    if (!config.neverExposeAuthenticationTokens) {
      errors.push("Authentication token protection must remain enabled");
    }
    if (!config.preserveMarketingTraceability) {
      errors.push("Marketing traceability must remain enabled");
    }
    if (!config.preserveEnterpriseIntegrity) {
      errors.push("Enterprise integrity must remain enabled");
    }
    if (!config.neverLogSensitiveMarketingInformation) {
      errors.push("Sensitive marketing log guard must remain enabled");
    }
    return this.report(started, errors, warnings);
  }

  validateMarketing(
    label: string,
    input: MarketingScaleInput,
    config: MarketingScaleEngineConfiguration,
  ): MarketingValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (input.validated !== true) {
      errors.push(
        `${label} requires validated=true — never recommend marketing expansion without validated performance`,
      );
    }
    if (input.companyReference && SENSITIVE.test(input.companyReference)) {
      errors.push("Company reference must not contain sensitive data");
    }
    if (input.campaignReference && SENSITIVE.test(input.campaignReference)) {
      errors.push("Campaign reference must not contain sensitive data");
    }
    if (!config.validationRulesEnabled) warnings.push("Validation rules disabled");
    if (!config.neverRecommendMarketingExpansionWithoutValidatedPerformance) {
      errors.push("Marketing expansion without validated performance is forbidden");
    }
    return this.report(started, errors, warnings);
  }
}
