/** R3-16 — Dashboard validator. */

import { EFD_METADATA_VERSION } from "./paths.js";
import type { ExecutiveFinancialDashboardConfiguration } from "./configuration.js";
import type {
  DashboardSnapshot,
  DashboardValidationReport,
  ExecutiveFinancialDashboardRecord,
} from "./types.js";

export class DashboardValidator {
  validateConfiguration(config: ExecutiveFinancialDashboardConfiguration): DashboardValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.executiveSummaryRulesEnabled) warnings.push("Executive summary rules disabled");
    if (config.dashboardRefreshFrequencyMs < 1000) {
      warnings.push("Dashboard refresh frequency very low");
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `efd-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: EFD_METADATA_VERSION,
    };
  }

  validateEngineRecord(record: ExecutiveFinancialDashboardRecord): DashboardValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.engineRecordId.startsWith("efd-")) {
      errors.push("Invalid engine record ID prefix");
    }
    if (!record.revenueEngineConnected) warnings.push("Revenue Engine not connected");
    if (!record.expenseEngineConnected) warnings.push("Expense Engine not connected");
    if (!record.cashFlowMonitorConnected) warnings.push("Cash Flow Monitor not connected");

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `efd-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: EFD_METADATA_VERSION,
    };
  }

  validateSnapshot(
    snapshot: DashboardSnapshot,
    config: ExecutiveFinancialDashboardConfiguration,
  ): DashboardValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!snapshot.dashboardId.startsWith("efd-rec-")) {
      errors.push("Invalid dashboard ID prefix");
    }
    if (snapshot.revenueSummary.count === 0) warnings.push("No revenue records in snapshot");
    if (snapshot.expenseSummary.count === 0) warnings.push("No expense records in snapshot");
    if (!config.validationRulesEnabled) warnings.push("Validation rules disabled");

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `efd-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: EFD_METADATA_VERSION,
    };
  }
}
