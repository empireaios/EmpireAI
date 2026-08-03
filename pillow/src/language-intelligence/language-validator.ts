/** X4-04 — Language Validator. */

import { LI_METADATA_VERSION } from "./paths.js";
import type { LanguageIntelligenceConfiguration } from "./configuration.js";
import type { LanguageAnalysisInput, LanguageValidationReport } from "./types.js";

export class LanguageValidator {
  validateConfiguration(
    config: LanguageIntelligenceConfiguration,
  ): LanguageValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.neverOverwriteCanonicalSourceContentAutomatically) {
      errors.push("Must never overwrite canonical source content automatically");
    }
    if (!config.preserveTranslationTraceability) {
      errors.push("Translation traceability must remain enabled");
    }
    if (!config.structuralSignalsOnly) {
      errors.push("Structural signals only mode required for X4-04");
    }
    if (!config.supportedLanguages?.length) {
      errors.push("At least one supported language is required");
    }
    if (!config.enabled) warnings.push("Language Intelligence disabled");
    return {
      validationReportId: `li-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: errors.length ? "fail" : warnings.length ? "partial" : "pass",
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: LI_METADATA_VERSION,
    };
  }

  validateInput(
    input: LanguageAnalysisInput,
    config: LanguageIntelligenceConfiguration,
  ): LanguageValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.enabled) errors.push("Language Intelligence is disabled");
    if (config.validationRulesEnabled && input.validated !== true) {
      errors.push("Language intelligence requires validated=true");
    }
    if (!config.translationRulesEnabled) {
      warnings.push("Translation rules disabled");
    }
    if (!input.language?.trim() && !input.sampleText?.trim()) {
      warnings.push("No language or sample text — default structural language will be used");
    }
    return {
      validationReportId: `li-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: errors.length ? "fail" : warnings.length ? "partial" : "pass",
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: LI_METADATA_VERSION,
    };
  }
}
