/** X4-03 — Localization Validator. */

import { LOC_METADATA_VERSION } from "./paths.js";
import type { LocalizationEngineConfiguration } from "./configuration.js";
import type { LocalizationInput, LocalizationValidationReport } from "./types.js";

export class LocalizationValidator {
  validateConfiguration(
    config: LocalizationEngineConfiguration,
  ): LocalizationValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.neverOverwriteCanonicalSourceContent) {
      errors.push("Must never overwrite canonical source content");
    }
    if (!config.preserveLocalizationTraceability) {
      errors.push("Localization traceability must remain enabled");
    }
    if (!config.structuralSignalsOnly) {
      errors.push("Structural signals only mode required for X4-03");
    }
    if (!config.enabled) warnings.push("Localization Engine disabled");
    return {
      validationReportId: `loc-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: errors.length ? "fail" : warnings.length ? "partial" : "pass",
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: LOC_METADATA_VERSION,
    };
  }

  validateInput(
    input: LocalizationInput,
    config: LocalizationEngineConfiguration,
  ): LocalizationValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.enabled) errors.push("Localization Engine is disabled");
    if (config.validationRulesEnabled && input.validated !== true) {
      errors.push("Localization requires validated=true");
    }
    if (!input.targetCountry?.trim()) {
      warnings.push("No target country provided — default structural country will be used");
    }
    return {
      validationReportId: `loc-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: errors.length ? "fail" : warnings.length ? "partial" : "pass",
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: LOC_METADATA_VERSION,
    };
  }
}
