/** R3-07 — Cash flow validator and validation engine. */

import { CF_METADATA_VERSION } from "./paths.js";
import type { CashFlowMonitorConfiguration } from "./configuration.js";
import type {
  CashFlowMonitorRecord,
  CashFlowRecord,
  CashFlowValidationReport,
} from "./types.js";

export class CashFlowValidator {
  validateConfiguration(config: CashFlowMonitorConfiguration): CashFlowValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.forecastRulesEnabled) warnings.push("Forecast rules disabled");
    if (config.liquidityThresholdLow >= config.liquidityThresholdAdequate) {
      warnings.push("Liquidity threshold ordering may be inconsistent");
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `cf-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: CF_METADATA_VERSION,
    };
  }

  validateMonitorRecord(record: CashFlowMonitorRecord): CashFlowValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.monitorRecordId.startsWith("cf-")) {
      errors.push("Invalid monitor record ID prefix");
    }
    if (!record.bankingIntegrationConnected) {
      warnings.push("Banking Integration not connected");
    }
    if (!record.revenueEngineConnected) warnings.push("Revenue Engine not connected");
    if (!record.expenseEngineConnected) warnings.push("Expense Engine not connected");

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `cf-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: CF_METADATA_VERSION,
    };
  }

  validateCashFlowRecord(record: CashFlowRecord): CashFlowValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.cashFlowRecordId.startsWith("cf-rec-")) {
      errors.push("Invalid cash flow record ID prefix");
    }
    if (record.closingBalance !== record.openingBalance + record.netCashFlow) {
      warnings.push("Closing balance does not match opening + net cash flow");
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `cf-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: CF_METADATA_VERSION,
    };
  }
}

export class CashFlowValidationEngine {
  constructor(private readonly validator: CashFlowValidator) {}

  validateForMonitoring(
    record: CashFlowRecord,
    config: CashFlowMonitorConfiguration,
  ): CashFlowValidationReport {
    if (!config.validationRulesEnabled) {
      return {
        validationReportId: `cf-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "pass",
        errors: [],
        warnings: ["Validation rules disabled"],
        durationMs: 0,
        metadataVersion: CF_METADATA_VERSION,
      };
    }
    return this.validator.validateCashFlowRecord(record);
  }
}
