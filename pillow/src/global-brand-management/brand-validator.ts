/** X4-11 — Brand Validator. */

import { GBM_METADATA_VERSION } from "./paths.js";
import type { GlobalBrandManagementConfiguration } from "./configuration.js";
import type { BrandAnalysisInput, BrandValidationReport } from "./types.js";

export class BrandValidator {
  validateConfiguration(
    config: GlobalBrandManagementConfiguration,
  ): BrandValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.neverModifyProtectedBrandAssetsWithoutAuthorization) {
      errors.push("Must never modify protected brand assets without authorization");
    }
    if (!config.requireAuthorizationForProtectedAssets) {
      errors.push("Authorization for protected assets must remain required");
    }
    if (!config.preserveBrandTraceability) {
      errors.push("Brand traceability must remain enabled");
    }
    if (!config.structuralSignalsOnly) {
      errors.push("Structural signals only mode required for X4-11");
    }
    if (!config.enabled) warnings.push("Global Brand Management disabled");
    return {
      validationReportId: `gbm-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: errors.length ? "fail" : warnings.length ? "partial" : "pass",
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: GBM_METADATA_VERSION,
    };
  }

  validateInput(
    input: BrandAnalysisInput,
    config: GlobalBrandManagementConfiguration,
  ): BrandValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.enabled) errors.push("Global Brand Management is disabled");
    if (config.validationRulesEnabled && input.validated !== true) {
      errors.push("Global brand management requires validated=true");
    }
    if (
      config.requireAuthorizationForProtectedAssets &&
      input.authorizeProtectedAssetModification === true &&
      input.validated !== true
    ) {
      errors.push("Protected brand asset modification requires validated authorization");
    }
    if (!input.brandReference?.trim()) {
      warnings.push("No brand reference — default structural brand will be used");
    }
    return {
      validationReportId: `gbm-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: errors.length ? "fail" : warnings.length ? "partial" : "pass",
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: GBM_METADATA_VERSION,
    };
  }
}
