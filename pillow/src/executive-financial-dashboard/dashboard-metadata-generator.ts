/** R3-16 — Dashboard metadata generator. */

import {
  EFD_CAPABILITIES,
  EFD_METADATA_VERSION,
  EXECUTIVE_FINANCIAL_DASHBOARD_ID,
} from "./paths.js";
import type {
  DashboardSnapshot,
  DashboardValidationReport,
  DashboardWidget,
  EngineState,
  ExecutiveDashboardRunReport,
  ExecutiveFinancialDashboardRecord,
  ValidationStatus,
} from "./types.js";

export function buildDashboardEngineRecordId(): string {
  return `efd-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildDashboardRunReportId(): string {
  return `efd-run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildDashboardId(): string {
  return `efd-rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class DashboardMetadataGenerator {
  buildEngineRecord(input: {
    frameworkModuleId: string | null;
    operationalState: EngineState;
    validationStatus: ValidationStatus;
    revenueEngineConnected: boolean;
    expenseEngineConnected: boolean;
    profitCalculationEngineConnected: boolean;
    cashFlowMonitorConnected: boolean;
    financialForecastEngineConnected: boolean;
    budgetManagementEngineConnected: boolean;
    financialRiskMonitorConnected: boolean;
  }): ExecutiveFinancialDashboardRecord {
    const healthStatus =
      input.operationalState === "failed"
        ? "failed"
        : input.operationalState === "active"
          ? "healthy"
          : "degraded";

    return {
      engineRecordId: buildDashboardEngineRecordId(),
      timestamp: new Date().toISOString(),
      engineId: EXECUTIVE_FINANCIAL_DASHBOARD_ID,
      engineVersion: EFD_METADATA_VERSION,
      currentOperationalState: input.operationalState,
      healthStatus,
      validationStatus: input.validationStatus,
      supportedCapabilities: [...EFD_CAPABILITIES],
      metadataVersion: EFD_METADATA_VERSION,
      frameworkModuleId: input.frameworkModuleId,
      revenueEngineConnected: input.revenueEngineConnected,
      expenseEngineConnected: input.expenseEngineConnected,
      profitCalculationEngineConnected: input.profitCalculationEngineConnected,
      cashFlowMonitorConnected: input.cashFlowMonitorConnected,
      financialForecastEngineConnected: input.financialForecastEngineConnected,
      budgetManagementEngineConnected: input.budgetManagementEngineConnected,
      financialRiskMonitorConnected: input.financialRiskMonitorConnected,
    };
  }

  buildSnapshot(input: Omit<DashboardSnapshot, "dashboardId" | "timestamp" | "metadataVersion">): DashboardSnapshot {
    return {
      dashboardId: buildDashboardId(),
      timestamp: new Date().toISOString(),
      metadataVersion: EFD_METADATA_VERSION,
      ...input,
    };
  }

  buildRunReport(input: {
    action: ExecutiveDashboardRunReport["action"];
    engineRecord: ExecutiveFinancialDashboardRecord;
    snapshots: DashboardSnapshot[];
    widgets: DashboardWidget[];
    validation: DashboardValidationReport;
    durationMs: number;
  }): ExecutiveDashboardRunReport {
    return {
      dashboardRunReportId: buildDashboardRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      snapshots: input.snapshots,
      widgets: input.widgets,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: EFD_METADATA_VERSION,
    };
  }
}
