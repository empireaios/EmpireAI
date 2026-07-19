/** R3-14 — Budget validator. */

import { BMG_METADATA_VERSION, BUDGET_CATEGORIES, BUDGET_PERIODS } from "./paths.js";
import type { BudgetManagementEngineConfiguration } from "./configuration.js";
import type {
  BudgetManagementEngineRecord,
  BudgetRecord,
  BudgetValidationReport,
} from "./types.js";

export class BudgetValidator {
  validateConfiguration(config: BudgetManagementEngineConfiguration): BudgetValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.budgetAllocationRulesEnabled) warnings.push("Budget allocation rules disabled");
    if (config.varianceThresholdPercent < 0 || config.varianceThresholdPercent > 100) {
      warnings.push("Variance threshold outside typical range");
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `bmg-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: BMG_METADATA_VERSION,
    };
  }

  validateEngineRecord(record: BudgetManagementEngineRecord): BudgetValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.engineRecordId.startsWith("bmg-")) {
      errors.push("Invalid engine record ID prefix");
    }
    if (!record.revenueEngineConnected) warnings.push("Revenue Engine not connected");
    if (!record.expenseEngineConnected) warnings.push("Expense Engine not connected");
    if (!record.cashFlowMonitorConnected) warnings.push("Cash Flow Monitor not connected");

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `bmg-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: BMG_METADATA_VERSION,
    };
  }

  validateBudgetRecord(
    record: BudgetRecord,
    config: BudgetManagementEngineConfiguration,
  ): BudgetValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.budgetRecordId.startsWith("bmg-rec-")) {
      errors.push("Invalid budget record ID prefix");
    }
    if (!record.budgetPeriod) errors.push("Budget period required");
    if (!record.budgetCategory) errors.push("Budget category required");
    if (!(BUDGET_PERIODS as readonly string[]).includes(record.budgetPeriod)) {
      errors.push("Invalid budget period");
    }
    if (!(BUDGET_CATEGORIES as readonly string[]).includes(record.budgetCategory)) {
      errors.push("Invalid budget category");
    }
    if (record.budgetAllocation <= 0) errors.push("Budget allocation must be positive");
    if (record.actualExpenditure < 0) warnings.push("Negative actual expenditure detected");
    if (
      config.validationRulesEnabled &&
      Math.abs(record.budgetVariance) > 0 &&
      record.budgetUtilizationPercentage > config.overrunThresholdPercent
    ) {
      warnings.push(`Utilization ${record.budgetUtilizationPercentage}% exceeds overrun threshold`);
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `bmg-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: BMG_METADATA_VERSION,
    };
  }

  validateBudgetDefinition(
    period: string,
    category: string,
    allocation: number,
    config: BudgetManagementEngineConfiguration,
  ): BudgetValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.budgetPeriodRulesEnabled) warnings.push("Budget period rules disabled");
    if (!(BUDGET_PERIODS as readonly string[]).includes(period)) {
      errors.push("Invalid budget period");
    }
    if (!(BUDGET_CATEGORIES as readonly string[]).includes(category)) {
      errors.push("Invalid budget category");
    }
    if (allocation <= 0) errors.push("Budget allocation must be positive");

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `bmg-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: BMG_METADATA_VERSION,
    };
  }
}
