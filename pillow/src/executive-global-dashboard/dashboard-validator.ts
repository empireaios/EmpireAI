/** X4-10 — Dashboard Validator. */

import { EGD_METADATA_VERSION } from "./paths.js";
import type { ExecutiveGlobalDashboardConfiguration } from "./configuration.js";
import type { DashboardAnalysisInput, DashboardValidationReport } from "./types.js";

export class DashboardValidator {
  validateConfiguration(
    config: ExecutiveGlobalDashboardConfiguration,
  ): DashboardValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.neverExposeRestrictedEnterpriseInformation) {
      errors.push("Must never expose restricted enterprise information");
    }
    if (!config.requireAuthorizedAccess) {
      errors.push("Authorized access must remain required");
    }
    if (!config.preserveDashboardTraceability) {
      errors.push("Dashboard traceability must remain enabled");
    }
    if (!config.structuralSignalsOnly) {
      errors.push("Structural signals only mode required for X4-10");
    }
    if (!config.enabled) warnings.push("Executive Global Dashboard disabled");
    return {
      validationReportId: `egd-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: errors.length ? "fail" : warnings.length ? "partial" : "pass",
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: EGD_METADATA_VERSION,
    };
  }

  validateInput(
    input: DashboardAnalysisInput,
    config: ExecutiveGlobalDashboardConfiguration,
  ): DashboardValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.enabled) errors.push("Executive Global Dashboard is disabled");
    if (config.validationRulesEnabled && input.validated !== true) {
      errors.push("Executive global dashboard requires validated=true");
    }
    if (config.requireAuthorizedAccess && input.authorized !== true && input.validated !== true) {
      errors.push("Authorized access required for executive dashboard");
    }
    if (!input.companyReference?.trim()) {
      warnings.push("No company reference — default structural company will be used");
    }
    return {
      validationReportId: `egd-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: errors.length ? "fail" : warnings.length ? "partial" : "pass",
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: EGD_METADATA_VERSION,
    };
  }
}
