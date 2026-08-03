/** X4-12 — Partnership Validator. */

import { IPE_METADATA_VERSION } from "./paths.js";
import type { InternationalPartnershipEngineConfiguration } from "./configuration.js";
import type { PartnershipAnalysisInput, PartnershipValidationReport } from "./types.js";

export class PartnershipValidator {
  validateConfiguration(
    config: InternationalPartnershipEngineConfiguration,
  ): PartnershipValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.neverApproveStrategicPartnershipsWithoutValidation) {
      errors.push("Must never approve strategic partnerships without validation");
    }
    if (!config.preservePartnershipTraceability) {
      errors.push("Partnership traceability must remain enabled");
    }
    if (!config.structuralSignalsOnly) {
      errors.push("Structural signals only mode required for X4-12");
    }
    if (!config.neverExposeCredentials) {
      errors.push("Credentials must never be exposed");
    }
    if (!config.neverExposeAuthenticationTokens) {
      errors.push("Authentication tokens must never be exposed");
    }
    if (!config.enabled) warnings.push("International Partnership Engine disabled");
    return {
      validationReportId: `ipe-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: errors.length ? "fail" : warnings.length ? "partial" : "pass",
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: IPE_METADATA_VERSION,
    };
  }

  validateInput(
    input: PartnershipAnalysisInput,
    config: InternationalPartnershipEngineConfiguration,
  ): PartnershipValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.enabled) errors.push("International Partnership Engine is disabled");
    if (config.validationRulesEnabled && input.validated !== true) {
      errors.push("International partnership management requires validated=true");
    }
    if (!input.partnerReference?.trim()) {
      warnings.push("No partner reference — default structural partner will be used");
    }
    if (!input.companyReference?.trim()) {
      warnings.push("No company reference — default structural company will be used");
    }
    return {
      validationReportId: `ipe-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: errors.length ? "fail" : warnings.length ? "partial" : "pass",
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: IPE_METADATA_VERSION,
    };
  }
}
