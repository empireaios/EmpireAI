/** R3-06 — Profit validator and validation engine. */

import { PC_METADATA_VERSION } from "./paths.js";
import type { ProfitCalculationEngineConfiguration } from "./configuration.js";
import type {
  ProfitEngineRecord,
  ProfitRecord,
  ProfitValidationReport,
} from "./types.js";

export class ProfitValidator {
  validateConfiguration(config: ProfitCalculationEngineConfiguration): ProfitValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.calculationRulesEnabled) warnings.push("Profit calculation rules disabled");
    if (!config.marginCalculationRulesEnabled) {
      warnings.push("Margin calculation rules disabled");
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `pc-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: PC_METADATA_VERSION,
    };
  }

  validateEngineRecord(record: ProfitEngineRecord): ProfitValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.engineRecordId.startsWith("pc-")) {
      errors.push("Invalid engine record ID prefix");
    }
    if (!record.revenueEngineConnected) warnings.push("Revenue Engine not connected");
    if (!record.expenseEngineConnected) warnings.push("Expense Engine not connected");

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `pc-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: PC_METADATA_VERSION,
    };
  }

  validateProfitRecord(record: ProfitRecord): ProfitValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.profitRecordId.startsWith("pc-rec-")) {
      errors.push("Invalid profit record ID prefix");
    }
    if (record.profitMargin < -100 || record.profitMargin > 100) {
      warnings.push("Profit margin outside typical range");
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `pc-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: PC_METADATA_VERSION,
    };
  }
}

export class ProfitValidationEngine {
  constructor(private readonly validator: ProfitValidator) {}

  validateForCalculation(
    record: ProfitRecord,
    config: ProfitCalculationEngineConfiguration,
  ): ProfitValidationReport {
    if (!config.validationRulesEnabled) {
      return {
        validationReportId: `pc-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "pass",
        errors: [],
        warnings: ["Validation rules disabled"],
        durationMs: 0,
        metadataVersion: PC_METADATA_VERSION,
      };
    }
    return this.validator.validateProfitRecord(record);
  }
}
