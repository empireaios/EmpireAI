/** X4-13 — Workforce Validator. */

import { TAL_METADATA_VERSION } from "./paths.js";
import type { GlobalTalentIntelligenceConfiguration } from "./configuration.js";
import type { WorkforceAnalysisInput, WorkforceValidationReport } from "./types.js";

export class WorkforceValidator {
  validateConfiguration(
    config: GlobalTalentIntelligenceConfiguration,
  ): WorkforceValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.neverMakeWorkforceDecisionsUsingUnvalidatedIntelligence) {
      errors.push("Must never make workforce decisions using unvalidated intelligence");
    }
    if (!config.preserveWorkforceTraceability) {
      errors.push("Workforce traceability must remain enabled");
    }
    if (!config.structuralSignalsOnly) {
      errors.push("Structural signals only mode required for X4-13");
    }
    if (!config.neverExposeCredentials) {
      errors.push("Credentials must never be exposed");
    }
    if (!config.neverExposeAuthenticationTokens) {
      errors.push("Authentication tokens must never be exposed");
    }
    if (!config.enabled) warnings.push("Global Talent Intelligence disabled");
    return {
      validationReportId: `tal-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: errors.length ? "fail" : warnings.length ? "partial" : "pass",
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: TAL_METADATA_VERSION,
    };
  }

  validateInput(
    input: WorkforceAnalysisInput,
    config: GlobalTalentIntelligenceConfiguration,
  ): WorkforceValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.enabled) errors.push("Global Talent Intelligence is disabled");
    if (config.validationRulesEnabled && input.validated !== true) {
      errors.push("Global talent intelligence requires validated=true");
    }
    if (!input.region?.trim()) {
      warnings.push("No region — default structural region will be used");
    }
    if (!input.companyReference?.trim()) {
      warnings.push("No company reference — default structural company will be used");
    }
    return {
      validationReportId: `tal-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: errors.length ? "fail" : warnings.length ? "partial" : "pass",
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: TAL_METADATA_VERSION,
    };
  }
}
