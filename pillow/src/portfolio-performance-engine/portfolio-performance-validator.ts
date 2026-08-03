/** X2-03 — Portfolio performance validator. */

import { PPE_METADATA_VERSION } from "./paths.js";
import type { PortfolioPerformanceEngineConfiguration } from "./configuration.js";
import type {
  CompareCompaniesInput,
  MeasureCompanyPerformanceInput,
  MetricBundle,
  PerformanceValidationReport,
  PortfolioPerformanceRecord,
} from "./types.js";

function clampIndex(value: number | undefined, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.min(100, value));
}

export class PortfolioPerformanceValidator {
  private report(
    started: number,
    errors: string[],
    warnings: string[],
  ): PerformanceValidationReport {
    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";
    return {
      validationReportId: `ppe-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: PPE_METADATA_VERSION,
    };
  }

  validateConfiguration(
    config: PortfolioPerformanceEngineConfiguration,
  ): PerformanceValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.enabled) warnings.push("Portfolio Performance Engine disabled by configuration");
    if (!config.neverManipulatePerformanceMetrics) {
      errors.push("Performance metric manipulation is forbidden");
    }
    if (!config.preservePerformanceTraceability) {
      errors.push("Performance traceability must remain enabled");
    }
    if (!config.preserveEnterpriseIntegrity) {
      errors.push("Enterprise integrity must remain enabled");
    }
    return this.report(started, errors, warnings);
  }

  normalizeMetrics(metrics?: Partial<MetricBundle>): MetricBundle {
    return {
      revenueIndex: clampIndex(metrics?.revenueIndex, 60),
      profitabilityIndex: clampIndex(metrics?.profitabilityIndex, 55),
      operationalEfficiencyIndex: clampIndex(metrics?.operationalEfficiencyIndex, 58),
      customerPerformanceIndex: clampIndex(metrics?.customerPerformanceIndex, 57),
      growthIndex: clampIndex(metrics?.growthIndex, 54),
    };
  }

  validateMeasure(
    input: MeasureCompanyPerformanceInput,
    config: PortfolioPerformanceEngineConfiguration,
  ): PerformanceValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!input.companyReference || input.companyReference.trim().length === 0) {
      errors.push("Missing company reference");
    }
    if (/(token|secret|password|credential)/i.test(input.companyReference ?? "")) {
      errors.push("Company reference must not contain credentials");
    }
    if (input.validated !== true) {
      errors.push("Company performance measurement requires validated=true");
    }
    if (!config.performanceScoringRulesEnabled) {
      warnings.push("Performance scoring rules disabled");
    }
    if (!config.validationRulesEnabled) warnings.push("Validation rules disabled");

    return this.report(started, errors, warnings);
  }

  validateCompare(
    input: CompareCompaniesInput,
    config: PortfolioPerformanceEngineConfiguration,
  ): PerformanceValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (input.validated !== true) errors.push("Company comparison requires validated=true");
    if (!config.companyComparisonRulesEnabled) {
      warnings.push("Company comparison rules disabled");
    }
    if (
      input.companyReferences &&
      input.companyReferences.length > config.maxCompaniesPerComparison
    ) {
      errors.push("Too many companies for comparison");
    }
    return this.report(started, errors, warnings);
  }

  validateRecord(record: PortfolioPerformanceRecord): PerformanceValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!record.portfolioPerformanceId.startsWith("ppe-")) {
      errors.push("Invalid portfolio performance ID prefix");
    }
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (record.manipulatedMetrics) errors.push("Metric manipulation is forbidden");
    if (record.overallPerformanceScore < 0 || record.overallPerformanceScore > 100) {
      errors.push("Overall performance score out of range");
    }
    return this.report(started, errors, warnings);
  }
}
