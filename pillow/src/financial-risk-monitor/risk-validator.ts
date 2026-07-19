/** R3-15 — Financial risk validator. */

import { FRM_METADATA_VERSION } from "./paths.js";
import type { FinancialRiskMonitorConfiguration } from "./configuration.js";
import type {
  FinancialRiskMonitorRecord,
  FinancialRiskRecord,
  RiskValidationReport,
} from "./types.js";

export class RiskValidator {
  validateConfiguration(config: FinancialRiskMonitorConfiguration): RiskValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.alertRulesEnabled) warnings.push("Alert rules disabled");
    if (config.compositeRiskThreshold < 0 || config.compositeRiskThreshold > 100) {
      warnings.push("Composite risk threshold outside typical range");
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `frm-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: FRM_METADATA_VERSION,
    };
  }

  validateEngineRecord(record: FinancialRiskMonitorRecord): RiskValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.engineRecordId.startsWith("frm-")) {
      errors.push("Invalid engine record ID prefix");
    }
    if (!record.revenueEngineConnected) warnings.push("Revenue Engine not connected");
    if (!record.expenseEngineConnected) warnings.push("Expense Engine not connected");
    if (!record.cashFlowMonitorConnected) warnings.push("Cash Flow Monitor not connected");

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `frm-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: FRM_METADATA_VERSION,
    };
  }

  validateRiskRecord(
    record: FinancialRiskRecord,
    config: FinancialRiskMonitorConfiguration,
  ): RiskValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.financialRiskId.startsWith("frm-rec-")) {
      errors.push("Invalid financial risk ID prefix");
    }
    if (!record.riskCategory) errors.push("Risk category required");
    if (record.riskScore < 0 || record.riskScore > 100) {
      errors.push("Risk score must be between 0 and 100");
    }
    if (
      config.validationRulesEnabled &&
      record.riskScore >= config.compositeRiskThreshold
    ) {
      warnings.push(`Risk score ${record.riskScore} exceeds composite threshold`);
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `frm-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: FRM_METADATA_VERSION,
    };
  }
}
