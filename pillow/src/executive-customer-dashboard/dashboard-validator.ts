/** R4-18 — Dashboard validator. */

import { ECD_METADATA_VERSION } from "./paths.js";
import type { ExecutiveCustomerDashboardConfiguration } from "./configuration.js";
import type {
  CustomerDashboardSnapshot,
  DashboardValidationReport,
  ExecutiveCustomerDashboardRecord,
} from "./types.js";

export class DashboardValidator {
  validateConfiguration(
    config: ExecutiveCustomerDashboardConfiguration,
  ): DashboardValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    if (config.maxRetryAttempts < 0) errors.push("maxRetryAttempts must be non-negative");
    if (config.dashboardRefreshFrequencyMs < 1000) {
      errors.push("dashboardRefreshFrequencyMs must be at least 1000");
    }
    return {
      validationReportId: `ecd-val-cfg-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: errors.length > 0 ? "fail" : "pass",
      errors,
      warnings: [],
      durationMs: Date.now() - started,
      metadataVersion: ECD_METADATA_VERSION,
    };
  }

  validateEngineRecord(record: ExecutiveCustomerDashboardRecord): DashboardValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!record.engineId) errors.push("Missing engine ID");
    if (!record.identityEngineConnected) warnings.push("Customer Identity Engine not connected");
    if (!record.timelineEngineConnected) warnings.push("Customer Timeline Engine not connected");
    const decision =
      errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";
    return {
      validationReportId: `ecd-val-eng-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: ECD_METADATA_VERSION,
    };
  }

  validateSnapshot(
    snapshot: CustomerDashboardSnapshot,
    config: ExecutiveCustomerDashboardConfiguration,
  ): DashboardValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!snapshot.dashboardId) errors.push("Dashboard ID is required");
    if (snapshot.customerGrowthSummary.totalCustomers < 0) {
      errors.push("Total customers cannot be negative");
    }
    if (!config.validationRulesEnabled) {
      warnings.push("Validation rules disabled — partial validation only");
    }
    const decision =
      errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";
    return {
      validationReportId: `ecd-val-snap-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: ECD_METADATA_VERSION,
    };
  }
}
