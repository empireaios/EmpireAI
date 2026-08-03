/** X1-14 — Revenue Validator. */

import { FRO_METADATA_VERSION } from "./paths.js";
import type { FirstRevenueOptimizerConfiguration } from "./configuration.js";
import type {
  OptimizeFirstRevenueInput,
  RevenueOptimizerEngineRecord,
  RevenueOptimizationRecord,
  RevenueValidationReport,
} from "./types.js";

export class RevenueValidator {
  validateConfiguration(
    config: FirstRevenueOptimizerConfiguration,
  ): RevenueValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.enabled) warnings.push("First Revenue Optimizer disabled");
    if (!config.neverExposeCredentials) errors.push("Credential protection must remain enabled");
    if (!config.neverModifyProductionPricingWithoutValidation) {
      errors.push("Production pricing modification without validation must remain prohibited");
    }
    if (!config.structuralSignalsOnly) {
      errors.push("Structural signals only mode must remain enabled");
    }
    if (!config.maskSensitiveValues) errors.push("Sensitive value masking must remain enabled");
    if (config.maxOptimizationsPerCycle < 1) errors.push("maxOptimizationsPerCycle must be >= 1");

    return this.build(errors, warnings, started);
  }

  validateEngineRecord(record: RevenueOptimizerEngineRecord): RevenueValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.engineRecordId.startsWith("fro-")) errors.push("Invalid engine record ID prefix");
    if (!record.metadataVersion) errors.push("Missing metadata version");
    for (const [key, present] of Object.entries(record.dependencyPresence)) {
      if (!present) warnings.push(`Dependency not connected: ${key}`);
    }

    return this.build(errors, warnings, started);
  }

  validateOptimizeInput(
    input: OptimizeFirstRevenueInput,
    config: FirstRevenueOptimizerConfiguration,
  ): RevenueValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.validationRulesEnabled) {
      return this.build([], ["Validation rules disabled"], started);
    }
    if (input.validated === false) {
      errors.push("Cannot optimize first revenue without validation acknowledgement");
    }
    if (!config.revenueAnalysisRulesEnabled) warnings.push("Revenue analysis rules disabled");
    if (!config.productEvaluationRulesEnabled) warnings.push("Product evaluation rules disabled");
    if (!config.optimizationRulesEnabled) warnings.push("Optimization rules disabled");

    return this.build(errors, warnings, started);
  }

  validateRevenueRecord(record: RevenueOptimizationRecord): RevenueValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.revenueOptimizationId.startsWith("fro-rev-")) {
      errors.push("Invalid revenue optimization ID prefix");
    }
    if (record.fabricatedRevenueFacts !== false) {
      errors.push("Fabricated revenue facts are forbidden");
    }
    if (record.structuralSignalOnly !== true) {
      errors.push("Revenue records must remain structural signals only");
    }
    if (record.modifiedProductionPricingWithoutValidation !== false) {
      errors.push("Production pricing modification without validation is forbidden");
    }
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (record.productPerformanceScore < 0 || record.productPerformanceScore > 100) {
      errors.push("Product performance score out of range");
    }
    if (!record.companyReference) warnings.push("Missing company reference");
    if (!record.productReference) warnings.push("Missing product reference");
    if (!record.revenueSummary) warnings.push("Missing revenue summary");

    return this.build(errors, warnings, started);
  }

  private build(
    errors: string[],
    warnings: string[],
    started: number,
  ): RevenueValidationReport {
    return {
      validationReportId: `fro-val-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      validationTimestamp: new Date().toISOString(),
      decision: errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass",
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: FRO_METADATA_VERSION,
    };
  }
}
