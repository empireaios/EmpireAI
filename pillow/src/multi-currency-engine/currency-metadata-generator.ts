/** R3-12 — Currency metadata generator. */

import {
  MC_CAPABILITIES,
  MC_METADATA_VERSION,
  MULTI_CURRENCY_ENGINE_ID,
} from "./paths.js";
import type {
  ConversionStatus,
  CurrencyAnomaly,
  CurrencyGainLossRecord,
  CurrencySummary,
  CurrencyValidationReport,
  EngineState,
  ExchangeRateRecord,
  MultiCurrencyEngineRecord,
  MultiCurrencyRunReport,
  CurrencyRecord,
  ValidationStatus,
} from "./types.js";

export function buildCurrencyEngineRecordId(): string {
  return `mc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildCurrencyRunReportId(): string {
  return `mc-run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildCurrencyRecordId(): string {
  return `mc-rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class CurrencyMetadataGenerator {
  buildEngineRecord(input: {
    frameworkModuleId: string | null;
    operationalState: EngineState;
    validationStatus: ValidationStatus;
    bankingIntegrationConnected: boolean;
    revenueEngineConnected: boolean;
    expenseEngineConnected: boolean;
    profitCalculationEngineConnected: boolean;
    taxIntelligenceEngineConnected: boolean;
  }): MultiCurrencyEngineRecord {
    const healthStatus =
      input.operationalState === "failed"
        ? "failed"
        : input.operationalState === "active"
          ? "healthy"
          : "degraded";

    return {
      engineRecordId: buildCurrencyEngineRecordId(),
      timestamp: new Date().toISOString(),
      engineId: MULTI_CURRENCY_ENGINE_ID,
      engineVersion: MC_METADATA_VERSION,
      currentOperationalState: input.operationalState,
      healthStatus,
      validationStatus: input.validationStatus,
      supportedCapabilities: [...MC_CAPABILITIES],
      metadataVersion: MC_METADATA_VERSION,
      frameworkModuleId: input.frameworkModuleId,
      bankingIntegrationConnected: input.bankingIntegrationConnected,
      revenueEngineConnected: input.revenueEngineConnected,
      expenseEngineConnected: input.expenseEngineConnected,
      profitCalculationEngineConnected: input.profitCalculationEngineConnected,
      taxIntelligenceEngineConnected: input.taxIntelligenceEngineConnected,
    };
  }

  buildCurrencyRecord(input: {
    sourceCurrency: string;
    targetCurrency: string;
    exchangeRate: number;
    convertedAmount: number;
    originalAmount: number;
    exchangeRateSource: string;
    conversionStatus: ConversionStatus;
    validationStatus: ValidationStatus;
  }): CurrencyRecord {
    return {
      currencyRecordId: buildCurrencyRecordId(),
      timestamp: new Date().toISOString(),
      sourceCurrency: input.sourceCurrency,
      targetCurrency: input.targetCurrency,
      exchangeRate: input.exchangeRate,
      convertedAmount: input.convertedAmount,
      originalAmount: input.originalAmount,
      exchangeRateSource: input.exchangeRateSource,
      conversionStatus: input.conversionStatus,
      validationStatus: input.validationStatus,
      metadataVersion: MC_METADATA_VERSION,
    };
  }

  buildGainLossRecord(input: {
    sourceCurrency: string;
    reportingCurrency: string;
    originalAmount: number;
    convertedAmount: number;
    gainLossAmount: number;
  }): CurrencyGainLossRecord {
    return {
      gainLossId: `mc-gl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      sourceCurrency: input.sourceCurrency,
      reportingCurrency: input.reportingCurrency,
      originalAmount: input.originalAmount,
      convertedAmount: input.convertedAmount,
      gainLossAmount: input.gainLossAmount,
      metadataVersion: MC_METADATA_VERSION,
    };
  }

  buildRunReport(input: {
    action: MultiCurrencyRunReport["action"];
    engineRecord: MultiCurrencyEngineRecord;
    currencyRecords: CurrencyRecord[];
    exchangeRates: ExchangeRateRecord[];
    gainLossRecords: CurrencyGainLossRecord[];
    anomalies: CurrencyAnomaly[];
    summary: CurrencySummary | null;
    validation: CurrencyValidationReport;
    durationMs: number;
  }): MultiCurrencyRunReport {
    return {
      currencyRunReportId: buildCurrencyRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      currencyRecords: input.currencyRecords,
      exchangeRates: input.exchangeRates,
      gainLossRecords: input.gainLossRecords,
      anomalies: input.anomalies,
      summary: input.summary,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: MC_METADATA_VERSION,
    };
  }
}
