/** R3-14 — Budget metadata generator. */

import {
  BMG_CAPABILITIES,
  BMG_METADATA_VERSION,
  BUDGET_MANAGEMENT_ENGINE_ID,
} from "./paths.js";
import type {
  BudgetManagementEngineRecord,
  BudgetManagementRunReport,
  BudgetOverrun,
  BudgetRecommendation,
  BudgetRecord,
  BudgetValidationReport,
  BudgetVariance,
  EngineState,
  ValidationStatus,
} from "./types.js";

export function buildBudgetEngineRecordId(): string {
  return `bmg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildBudgetRunReportId(): string {
  return `bmg-run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildBudgetRecordId(): string {
  return `bmg-rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class BudgetMetadataGenerator {
  buildEngineRecord(input: {
    frameworkModuleId: string | null;
    operationalState: EngineState;
    validationStatus: ValidationStatus;
    revenueEngineConnected: boolean;
    expenseEngineConnected: boolean;
    profitCalculationEngineConnected: boolean;
    cashFlowMonitorConnected: boolean;
    financialForecastEngineConnected: boolean;
  }): BudgetManagementEngineRecord {
    const healthStatus =
      input.operationalState === "failed"
        ? "failed"
        : input.operationalState === "active"
          ? "healthy"
          : "degraded";

    return {
      engineRecordId: buildBudgetEngineRecordId(),
      timestamp: new Date().toISOString(),
      engineId: BUDGET_MANAGEMENT_ENGINE_ID,
      engineVersion: BMG_METADATA_VERSION,
      currentOperationalState: input.operationalState,
      healthStatus,
      validationStatus: input.validationStatus,
      supportedCapabilities: [...BMG_CAPABILITIES],
      metadataVersion: BMG_METADATA_VERSION,
      frameworkModuleId: input.frameworkModuleId,
      revenueEngineConnected: input.revenueEngineConnected,
      expenseEngineConnected: input.expenseEngineConnected,
      profitCalculationEngineConnected: input.profitCalculationEngineConnected,
      cashFlowMonitorConnected: input.cashFlowMonitorConnected,
      financialForecastEngineConnected: input.financialForecastEngineConnected,
    };
  }

  buildBudgetRecord(input: {
    budgetPeriod: string;
    budgetCategory: string;
    budgetAllocation: number;
    actualExpenditure: number;
    validationStatus: ValidationStatus;
    budgetStatus?: BudgetRecord["budgetStatus"];
  }): BudgetRecord {
    const remaining = Math.round((input.budgetAllocation - input.actualExpenditure) * 100) / 100;
    const variance = Math.round((input.actualExpenditure - input.budgetAllocation) * 100) / 100;
    const utilization =
      input.budgetAllocation > 0
        ? Math.round((input.actualExpenditure / input.budgetAllocation) * 10000) / 100
        : 0;
    const budgetStatus =
      input.budgetStatus ??
      (utilization >= 100 ? "exceeded" : utilization > 0 ? "active" : "draft");

    return {
      budgetRecordId: buildBudgetRecordId(),
      timestamp: new Date().toISOString(),
      budgetPeriod: input.budgetPeriod,
      budgetCategory: input.budgetCategory,
      budgetAllocation: input.budgetAllocation,
      actualExpenditure: input.actualExpenditure,
      remainingBudget: remaining,
      budgetVariance: variance,
      budgetUtilizationPercentage: utilization,
      budgetStatus,
      validationStatus: input.validationStatus,
      metadataVersion: BMG_METADATA_VERSION,
    };
  }

  buildRunReport(input: {
    action: BudgetManagementRunReport["action"];
    engineRecord: BudgetManagementEngineRecord;
    budgetRecords: BudgetRecord[];
    variances: BudgetVariance[];
    overruns: BudgetOverrun[];
    recommendations: BudgetRecommendation[];
    validation: BudgetValidationReport;
    durationMs: number;
  }): BudgetManagementRunReport {
    return {
      budgetRunReportId: buildBudgetRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      budgetRecords: input.budgetRecords,
      variances: input.variances,
      overruns: input.overruns,
      recommendations: input.recommendations,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: BMG_METADATA_VERSION,
    };
  }
}
