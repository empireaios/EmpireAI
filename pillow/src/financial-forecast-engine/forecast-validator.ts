/** R3-13 — Forecast validator. */

import { FCT_METADATA_VERSION } from "./paths.js";
import type { FinancialForecastEngineConfiguration } from "./configuration.js";
import type {
  FinancialForecastEngineRecord,
  ForecastRecord,
  ForecastValidationReport,
} from "./types.js";

export class ForecastValidator {
  validateConfiguration(config: FinancialForecastEngineConfiguration): ForecastValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.forecastCalculationRulesEnabled) warnings.push("Forecast calculation rules disabled");
    if (config.confidenceThreshold < 0 || config.confidenceThreshold > 100) {
      warnings.push("Confidence threshold outside typical range");
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `fct-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: FCT_METADATA_VERSION,
    };
  }

  validateEngineRecord(record: FinancialForecastEngineRecord): ForecastValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.engineRecordId.startsWith("fct-")) {
      errors.push("Invalid engine record ID prefix");
    }
    if (!record.revenueEngineConnected) warnings.push("Revenue Engine not connected");
    if (!record.expenseEngineConnected) warnings.push("Expense Engine not connected");
    if (!record.cashFlowMonitorConnected) warnings.push("Cash Flow Monitor not connected");

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `fct-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: FCT_METADATA_VERSION,
    };
  }

  validateForecastRecord(
    record: ForecastRecord,
    config: FinancialForecastEngineConfiguration,
  ): ForecastValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.forecastRecordId.startsWith("fct-rec-")) {
      errors.push("Invalid forecast record ID prefix");
    }
    if (!record.forecastPeriod) errors.push("Forecast period required");
    if (record.forecastConfidenceScore < config.confidenceThreshold) {
      warnings.push(`Confidence ${record.forecastConfidenceScore} below threshold ${config.confidenceThreshold}`);
    }
    if (record.revenueForecast < 0 || record.expenseForecast < 0) {
      warnings.push("Negative forecast components detected");
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `fct-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: FCT_METADATA_VERSION,
    };
  }
}
