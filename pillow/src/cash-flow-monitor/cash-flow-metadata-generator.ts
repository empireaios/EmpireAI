/** R3-07 — Cash flow metadata generator. */

import {
  CF_CAPABILITIES,
  CF_METADATA_VERSION,
  CASH_FLOW_MONITOR_ID,
} from "./paths.js";
import type {
  CashFlowAggregationSummary,
  CashFlowAnomaly,
  CashFlowForecast,
  CashFlowMonitorRecord,
  CashFlowMonitorRunReport,
  CashFlowRecord,
  CashFlowValidationReport,
  EngineState,
  LiquidityStatus,
  ValidationStatus,
} from "./types.js";

export function buildMonitorRecordId(): string {
  return `cf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildCashFlowRunReportId(): string {
  return `cf-run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildCashFlowRecordId(): string {
  return `cf-rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildForecastId(): string {
  return `cf-fcst-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildAggregationSummaryId(): string {
  return `cf-agg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class CashFlowMetadataGenerator {
  buildMonitorRecord(input: {
    frameworkModuleId: string | null;
    operationalState: EngineState;
    validationStatus: ValidationStatus;
    bankingIntegrationConnected: boolean;
    revenueEngineConnected: boolean;
    expenseEngineConnected: boolean;
    profitCalculationEngineConnected: boolean;
  }): CashFlowMonitorRecord {
    const healthStatus =
      input.operationalState === "failed"
        ? "failed"
        : input.operationalState === "active"
          ? "healthy"
          : "degraded";

    return {
      monitorRecordId: buildMonitorRecordId(),
      timestamp: new Date().toISOString(),
      monitorId: CASH_FLOW_MONITOR_ID,
      monitorVersion: CF_METADATA_VERSION,
      currentOperationalState: input.operationalState,
      healthStatus,
      validationStatus: input.validationStatus,
      supportedCapabilities: [...CF_CAPABILITIES],
      metadataVersion: CF_METADATA_VERSION,
      frameworkModuleId: input.frameworkModuleId,
      bankingIntegrationConnected: input.bankingIntegrationConnected,
      revenueEngineConnected: input.revenueEngineConnected,
      expenseEngineConnected: input.expenseEngineConnected,
      profitCalculationEngineConnected: input.profitCalculationEngineConnected,
    };
  }

  buildCashFlowRecord(input: {
    bankingReference: string | null;
    revenueReference: string | null;
    expenseReference: string | null;
    openingBalance: number;
    cashInflow: number;
    cashOutflow: number;
    closingBalance: number;
    netCashFlow: number;
    operatingCashFlow: number;
    liquidityStatus: LiquidityStatus;
    validationStatus: ValidationStatus;
  }): CashFlowRecord {
    return {
      cashFlowRecordId: buildCashFlowRecordId(),
      timestamp: new Date().toISOString(),
      bankingReference: input.bankingReference,
      revenueReference: input.revenueReference,
      expenseReference: input.expenseReference,
      openingBalance: input.openingBalance,
      cashInflow: input.cashInflow,
      cashOutflow: input.cashOutflow,
      closingBalance: input.closingBalance,
      netCashFlow: input.netCashFlow,
      operatingCashFlow: input.operatingCashFlow,
      liquidityStatus: input.liquidityStatus,
      validationStatus: input.validationStatus,
      metadataVersion: CF_METADATA_VERSION,
    };
  }

  buildForecast(input: {
    horizonDays: number;
    projectedClosingBalance: number;
    projectedNetCashFlow: number;
    liquidityStatus: LiquidityStatus;
  }): CashFlowForecast {
    return {
      forecastId: buildForecastId(),
      timestamp: new Date().toISOString(),
      horizonDays: input.horizonDays,
      projectedClosingBalance: input.projectedClosingBalance,
      projectedNetCashFlow: input.projectedNetCashFlow,
      liquidityStatus: input.liquidityStatus,
      metadataVersion: CF_METADATA_VERSION,
    };
  }

  buildAggregationSummary(input: {
    records: CashFlowRecord[];
    liquidityStatus: LiquidityStatus;
  }): CashFlowAggregationSummary {
    let totalInflow = 0;
    let totalOutflow = 0;
    let netCashFlow = 0;
    let operatingCashFlow = 0;
    let closingBalance = 0;

    for (const record of input.records) {
      totalInflow += record.cashInflow;
      totalOutflow += record.cashOutflow;
      netCashFlow += record.netCashFlow;
      operatingCashFlow += record.operatingCashFlow;
      closingBalance = record.closingBalance;
    }

    return {
      summaryId: buildAggregationSummaryId(),
      timestamp: new Date().toISOString(),
      totalInflow,
      totalOutflow,
      netCashFlow,
      operatingCashFlow,
      closingBalance,
      liquidityStatus: input.liquidityStatus,
      totalRecords: input.records.length,
      metadataVersion: CF_METADATA_VERSION,
    };
  }

  buildRunReport(input: {
    action: CashFlowMonitorRunReport["action"];
    monitorRecord: CashFlowMonitorRecord;
    cashFlowRecords: CashFlowRecord[];
    forecast: CashFlowForecast | null;
    aggregation: CashFlowAggregationSummary | null;
    anomalies: CashFlowAnomaly[];
    validation: CashFlowValidationReport;
    durationMs: number;
  }): CashFlowMonitorRunReport {
    return {
      cashFlowRunReportId: buildCashFlowRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      monitorRecord: input.monitorRecord,
      cashFlowRecords: input.cashFlowRecords,
      forecast: input.forecast,
      aggregation: input.aggregation,
      anomalies: input.anomalies,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: CF_METADATA_VERSION,
    };
  }
}
