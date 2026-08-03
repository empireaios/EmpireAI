/** X4-14 — Regional Validator. */

import { GRI_METADATA_VERSION } from "./paths.js";
import type { GlobalRiskIntelligenceConfiguration } from "./configuration.js";
import type { RegionalOptimizationInput, RegionalValidationReport } from "./types.js";

export class RegionalValidator {
  validateConfiguration(
    config: GlobalRiskIntelligenceConfiguration,
  ): RegionalValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.neverOptimizeUsingUnvalidatedRegionalIntelligence) {
      errors.push("Must never optimize using unvalidated regional intelligence");
    }
    if (!config.preserveOptimizationTraceability) {
      errors.push("Optimization traceability must remain enabled");
    }
    if (!config.structuralSignalsOnly) {
      errors.push("Structural signals only mode required for X4-14");
    }
    if (!config.neverExposeCredentials) {
      errors.push("Credentials must never be exposed");
    }
    if (!config.neverExposeAuthenticationTokens) {
      errors.push("Authentication tokens must never be exposed");
    }
    if (!config.enabled) warnings.push("Global Risk Intelligence disabled");
    return {
      validationReportId: `gri-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: errors.length ? "fail" : warnings.length ? "partial" : "pass",
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: GRI_METADATA_VERSION,
    };
  }

  validateInput(
    input: RegionalOptimizationInput,
    config: GlobalRiskIntelligenceConfiguration,
  ): RegionalValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.enabled) errors.push("Global Risk Intelligence is disabled");
    if (config.validationRulesEnabled && input.validated !== true) {
      errors.push("Regional growth optimization requires validated=true");
    }
    if (!input.region?.trim()) {
      warnings.push("No region — default structural region will be used");
    }
    if (!input.companyReference?.trim()) {
      warnings.push("No company reference — default structural company will be used");
    }
    return {
      validationReportId: `gri-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: errors.length ? "fail" : warnings.length ? "partial" : "pass",
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: GRI_METADATA_VERSION,
    };
  }
}
