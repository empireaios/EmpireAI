/** X4-06 — Compliance Validator. */

import { RCE_METADATA_VERSION } from "./paths.js";
import type { RegionalComplianceEngineConfiguration } from "./configuration.js";
import type { ComplianceAnalysisInput, ComplianceValidationReport } from "./types.js";

export class ComplianceValidator {
  validateConfiguration(
    config: RegionalComplianceEngineConfiguration,
  ): ComplianceValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.neverFalselyCertifyCompliance) {
      errors.push("Must never falsely certify compliance");
    }
    if (!config.preserveRegulatoryTraceability) {
      errors.push("Regulatory traceability must remain enabled");
    }
    if (!config.structuralSignalsOnly) {
      errors.push("Structural signals only mode required for X4-06");
    }
    if (!config.enabled) warnings.push("Regional Compliance Engine disabled");
    return {
      validationReportId: `rce-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: errors.length ? "fail" : warnings.length ? "partial" : "pass",
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: RCE_METADATA_VERSION,
    };
  }

  validateInput(
    input: ComplianceAnalysisInput,
    config: RegionalComplianceEngineConfiguration,
  ): ComplianceValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.enabled) errors.push("Regional Compliance Engine is disabled");
    if (config.validationRulesEnabled && input.validated !== true) {
      errors.push("Regional compliance requires validated=true");
    }
    if (
      config.complianceValidationRulesEnabled === false
    ) {
      warnings.push("Compliance validation rules disabled");
    }
    if (!input.country?.trim()) {
      warnings.push("No country provided — default structural country will be used");
    }
    return {
      validationReportId: `rce-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: errors.length ? "fail" : warnings.length ? "partial" : "pass",
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: RCE_METADATA_VERSION,
    };
  }
}
