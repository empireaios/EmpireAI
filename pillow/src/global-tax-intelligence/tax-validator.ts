/** X4-07 — Tax Validator. */

import { GTI_METADATA_VERSION } from "./paths.js";
import type { GlobalTaxIntelligenceConfiguration } from "./configuration.js";
import type { TaxAnalysisInput, TaxValidationReport } from "./types.js";

export class TaxValidator {
  validateConfiguration(
    config: GlobalTaxIntelligenceConfiguration,
  ): TaxValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.neverProvideUnvalidatedTaxAsLegalAdvice) {
      errors.push("Must never provide unvalidated tax calculations as legal advice");
    }
    if (!config.preserveTaxCalculationTraceability) {
      errors.push("Tax calculation traceability must remain enabled");
    }
    if (!config.structuralSignalsOnly) {
      errors.push("Structural signals only mode required for X4-07");
    }
    if (!config.enabled) warnings.push("Global Tax Intelligence disabled");
    return {
      validationReportId: `gti-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: errors.length ? "fail" : warnings.length ? "partial" : "pass",
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: GTI_METADATA_VERSION,
    };
  }

  validateInput(
    input: TaxAnalysisInput,
    config: GlobalTaxIntelligenceConfiguration,
  ): TaxValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.enabled) errors.push("Global Tax Intelligence is disabled");
    if (config.validationRulesEnabled && input.validated !== true) {
      errors.push("Global tax intelligence requires validated=true");
    }
    if (!config.taxCalculationRulesEnabled) {
      warnings.push("Tax calculation rules disabled");
    }
    if (!input.country?.trim()) {
      warnings.push("No country provided — default structural country will be used");
    }
    return {
      validationReportId: `gti-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: errors.length ? "fail" : warnings.length ? "partial" : "pass",
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: GTI_METADATA_VERSION,
    };
  }
}
