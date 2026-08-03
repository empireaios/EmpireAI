/** X4-09 — Market Validator. */

import { GMI_METADATA_VERSION } from "./paths.js";
import type { GlobalMarketIntelligenceConfiguration } from "./configuration.js";
import type { MarketAnalysisInput, MarketValidationReport } from "./types.js";

export class MarketValidator {
  validateConfiguration(
    config: GlobalMarketIntelligenceConfiguration,
  ): MarketValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.neverRecommendWithUnvalidatedIntelligence) {
      errors.push("Must never generate market recommendations from unvalidated intelligence");
    }
    if (!config.preserveMarketTraceability) {
      errors.push("Market traceability must remain enabled");
    }
    if (!config.structuralSignalsOnly) {
      errors.push("Structural signals only mode required for X4-09");
    }
    if (!config.enabled) warnings.push("Global Market Intelligence disabled");
    return {
      validationReportId: `gmi-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: errors.length ? "fail" : warnings.length ? "partial" : "pass",
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: GMI_METADATA_VERSION,
    };
  }

  validateInput(
    input: MarketAnalysisInput,
    config: GlobalMarketIntelligenceConfiguration,
  ): MarketValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.enabled) errors.push("Global Market Intelligence is disabled");
    if (config.validationRulesEnabled && input.validated !== true) {
      errors.push("Global market intelligence requires validated=true");
    }
    if (!config.marketMonitoringRulesEnabled) {
      warnings.push("Market monitoring rules disabled");
    }
    if (!input.country?.trim()) {
      warnings.push("No country provided — default structural country will be used");
    }
    return {
      validationReportId: `gmi-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: errors.length ? "fail" : warnings.length ? "partial" : "pass",
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: GMI_METADATA_VERSION,
    };
  }
}
