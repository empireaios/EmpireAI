/** R3-15 — Financial risk metadata generator. */

import {
  FRM_CAPABILITIES,
  FRM_METADATA_VERSION,
  FINANCIAL_RISK_MONITOR_ID,
} from "./paths.js";
import type {
  EngineState,
  FinancialAnomaly,
  FinancialRiskAlert,
  FinancialRiskMonitorRecord,
  FinancialRiskRecord,
  FinancialRiskRunReport,
  RiskValidationReport,
  ValidationStatus,
} from "./types.js";

export function buildRiskEngineRecordId(): string {
  return `frm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildRiskRunReportId(): string {
  return `frm-run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildFinancialRiskId(): string {
  return `frm-rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class RiskMetadataGenerator {
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
  }): FinancialRiskMonitorRecord {
    const healthStatus =
      input.operationalState === "failed"
        ? "failed"
        : input.operationalState === "active"
          ? "healthy"
          : "degraded";

    return {
      engineRecordId: buildRiskEngineRecordId(),
      timestamp: new Date().toISOString(),
      engineId: FINANCIAL_RISK_MONITOR_ID,
      engineVersion: FRM_METADATA_VERSION,
      currentOperationalState: input.operationalState,
      healthStatus,
      validationStatus: input.validationStatus,
      supportedCapabilities: [...FRM_CAPABILITIES],
      metadataVersion: FRM_METADATA_VERSION,
      frameworkModuleId: input.frameworkModuleId,
      revenueEngineConnected: input.revenueEngineConnected,
      expenseEngineConnected: input.expenseEngineConnected,
      profitCalculationEngineConnected: input.profitCalculationEngineConnected,
      cashFlowMonitorConnected: input.cashFlowMonitorConnected,
      financialForecastEngineConnected: input.financialForecastEngineConnected,
      budgetManagementEngineConnected: input.budgetManagementEngineConnected,
    };
  }

  buildRiskRecord(input: {
    riskCategory: string;
    riskScore: number;
    liquidityStatus: FinancialRiskRecord["liquidityStatus"];
    profitabilityStatus: FinancialRiskRecord["profitabilityStatus"];
    budgetStatus: FinancialRiskRecord["budgetStatus"];
    revenueRisk: number;
    expenseRisk: number;
    activeAlerts: number;
    validationStatus: ValidationStatus;
  }): FinancialRiskRecord {
    return {
      financialRiskId: buildFinancialRiskId(),
      timestamp: new Date().toISOString(),
      riskCategory: input.riskCategory,
      riskScore: input.riskScore,
      liquidityStatus: input.liquidityStatus,
      profitabilityStatus: input.profitabilityStatus,
      budgetStatus: input.budgetStatus,
      revenueRisk: input.revenueRisk,
      expenseRisk: input.expenseRisk,
      activeAlerts: input.activeAlerts,
      validationStatus: input.validationStatus,
      metadataVersion: FRM_METADATA_VERSION,
    };
  }

  buildRunReport(input: {
    action: FinancialRiskRunReport["action"];
    engineRecord: FinancialRiskMonitorRecord;
    riskRecords: FinancialRiskRecord[];
    alerts: FinancialRiskAlert[];
    anomalies: FinancialAnomaly[];
    validation: RiskValidationReport;
    durationMs: number;
  }): FinancialRiskRunReport {
    return {
      riskRunReportId: buildRiskRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      riskRecords: input.riskRecords,
      alerts: input.alerts,
      anomalies: input.anomalies,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: FRM_METADATA_VERSION,
    };
  }
}
