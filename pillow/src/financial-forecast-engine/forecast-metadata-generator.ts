/** R3-13 — Forecast metadata generator. */

import {
  FCT_CAPABILITIES,
  FCT_METADATA_VERSION,
  FINANCIAL_FORECAST_ENGINE_ID,
} from "./paths.js";
import type {
  EngineState,
  FinancialForecastEngineRecord,
  FinancialForecastRunReport,
  FinancialRisk,
  FinancialTrend,
  ForecastDeviation,
  ForecastRecord,
  ForecastValidationReport,
  ValidationStatus,
} from "./types.js";

export function buildForecastEngineRecordId(): string {
  return `fct-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildForecastRunReportId(): string {
  return `fct-run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildForecastRecordId(): string {
  return `fct-rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class ForecastMetadataGenerator {
  buildEngineRecord(input: {
    frameworkModuleId: string | null;
    operationalState: EngineState;
    validationStatus: ValidationStatus;
    revenueEngineConnected: boolean;
    expenseEngineConnected: boolean;
    profitCalculationEngineConnected: boolean;
    cashFlowMonitorConnected: boolean;
    multiCurrencyEngineConnected: boolean;
  }): FinancialForecastEngineRecord {
    const healthStatus =
      input.operationalState === "failed"
        ? "failed"
        : input.operationalState === "active"
          ? "healthy"
          : "degraded";

    return {
      engineRecordId: buildForecastEngineRecordId(),
      timestamp: new Date().toISOString(),
      engineId: FINANCIAL_FORECAST_ENGINE_ID,
      engineVersion: FCT_METADATA_VERSION,
      currentOperationalState: input.operationalState,
      healthStatus,
      validationStatus: input.validationStatus,
      supportedCapabilities: [...FCT_CAPABILITIES],
      metadataVersion: FCT_METADATA_VERSION,
      frameworkModuleId: input.frameworkModuleId,
      revenueEngineConnected: input.revenueEngineConnected,
      expenseEngineConnected: input.expenseEngineConnected,
      profitCalculationEngineConnected: input.profitCalculationEngineConnected,
      cashFlowMonitorConnected: input.cashFlowMonitorConnected,
      multiCurrencyEngineConnected: input.multiCurrencyEngineConnected,
    };
  }

  buildForecastRecord(input: {
    forecastPeriod: string;
    revenueForecast: number;
    expenseForecast: number;
    profitForecast: number;
    cashFlowForecast: number;
    liquidityForecast: number;
    forecastConfidenceScore: number;
    validationStatus: ValidationStatus;
  }): ForecastRecord {
    return {
      forecastRecordId: buildForecastRecordId(),
      timestamp: new Date().toISOString(),
      forecastPeriod: input.forecastPeriod,
      revenueForecast: input.revenueForecast,
      expenseForecast: input.expenseForecast,
      profitForecast: input.profitForecast,
      cashFlowForecast: input.cashFlowForecast,
      liquidityForecast: input.liquidityForecast,
      forecastConfidenceScore: input.forecastConfidenceScore,
      validationStatus: input.validationStatus,
      metadataVersion: FCT_METADATA_VERSION,
    };
  }

  buildRunReport(input: {
    action: FinancialForecastRunReport["action"];
    engineRecord: FinancialForecastEngineRecord;
    forecastRecords: ForecastRecord[];
    trends: FinancialTrend[];
    deviations: ForecastDeviation[];
    risks: FinancialRisk[];
    validation: ForecastValidationReport;
    durationMs: number;
  }): FinancialForecastRunReport {
    return {
      forecastRunReportId: buildForecastRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      forecastRecords: input.forecastRecords,
      trends: input.trends,
      deviations: input.deviations,
      risks: input.risks,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: FCT_METADATA_VERSION,
    };
  }
}
