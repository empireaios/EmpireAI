/** R5-13 — Budget Validator. */

import { BOE_METADATA_VERSION, MARKETING_CHANNELS } from "./paths.js";
import type { BudgetOptimizationEngineConfiguration } from "./configuration.js";
import type {
  AllocateBudgetInput,
  BudgetEngineRecord,
  BudgetRecord,
  BudgetValidationReport,
  OptimizeBudgetsInput,
} from "./types.js";

export class BudgetValidator {
  validateConfiguration(
    config: BudgetOptimizationEngineConfiguration,
  ): BudgetValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.enabled) warnings.push("Budget Optimization Engine disabled");
    if (!config.validationRulesEnabled) {
      warnings.push("Validation rules disabled by configuration");
    }
    if (!config.neverModifyActiveBudgetsWithoutValidation) {
      errors.push("Active budget modification protection must remain enabled");
    }
    if (!config.maskSensitiveValues) {
      errors.push("Sensitive value masking must remain enabled");
    }
    if (config.overspendThresholdPercent <= 0) {
      errors.push("Overspend threshold must be positive");
    }

    return this.build(errors, warnings, started);
  }

  validateEngineRecord(record: BudgetEngineRecord): BudgetValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.engineRecordId.startsWith("boe-")) errors.push("Invalid engine record ID prefix");
    if (!record.metadataVersion) errors.push("Missing metadata version");

    const connected = Object.values(record.dependencyPresence).filter(Boolean).length;
    if (connected === 0) warnings.push("No budget optimization dependencies connected");
    if (!record.dependencyPresence.campaignManager) {
      warnings.push("Campaign Manager dependency not connected");
    }
    if (!record.dependencyPresence.attributionEngine) {
      warnings.push("Attribution Engine dependency not connected");
    }

    return this.build(errors, warnings, started);
  }

  validateAllocate(
    input: AllocateBudgetInput,
    config: BudgetOptimizationEngineConfiguration,
  ): BudgetValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.validationRulesEnabled) {
      return this.build([], ["Validation rules disabled"], started);
    }
    if (!config.allocationRulesEnabled) {
      errors.push("Allocation rules disabled");
    }
    if (!(MARKETING_CHANNELS as readonly string[]).includes(input.marketingChannel)) {
      errors.push(`Invalid marketing channel: ${input.marketingChannel}`);
    }
    if (!Number.isFinite(input.allocatedBudget) || input.allocatedBudget <= 0) {
      errors.push("Allocated budget must be a positive number");
    }
    if (input.currentSpend !== undefined && input.currentSpend < 0) {
      errors.push("Current spend cannot be negative");
    }

    return this.build(errors, warnings, started);
  }

  validateOptimize(
    input: OptimizeBudgetsInput,
    config: BudgetOptimizationEngineConfiguration,
  ): BudgetValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.validationRulesEnabled) {
      return this.build([], ["Validation rules disabled"], started);
    }
    if (!config.reallocationRulesEnabled) {
      errors.push("Reallocation rules disabled");
    }
    if (config.neverModifyActiveBudgetsWithoutValidation && input.validated === false) {
      errors.push("Cannot modify active campaign budgets without validation");
    }

    return this.build(errors, warnings, started);
  }

  validateBudgetRecord(record: BudgetRecord): BudgetValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.budgetRecordId.startsWith("boe-bud-")) {
      errors.push("Invalid budget record ID prefix");
    }
    if (record.allocatedBudget <= 0) errors.push("Allocated budget must be positive");
    if (record.currentSpend < 0) errors.push("Current spend cannot be negative");
    if (record.appliedToActiveCampaign !== false) {
      errors.push("Budget changes must not apply to active campaigns without validation gate");
    }
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (record.overspendDetected) {
      warnings.push("Overspend detected on budget record");
    }

    return this.build(errors, warnings, started);
  }

  private build(
    errors: string[],
    warnings: string[],
    started: number,
  ): BudgetValidationReport {
    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";
    return {
      validationReportId: `boe-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: BOE_METADATA_VERSION,
    };
  }
}
