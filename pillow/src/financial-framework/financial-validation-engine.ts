/** R3-01 — Financial validation engine. */

import { FINANCIAL_METADATA_VERSION } from "./paths.js";
import type { FinancialFrameworkConfiguration } from "./configuration.js";
import type {
  FinancialFrameworkRecord,
  FinancialModuleDefinition,
  FinancialValidationReport,
} from "./types.js";
import { FinancialValidator } from "./financial-validator.js";

export class FinancialValidationEngine {
  private readonly validator = new FinancialValidator();

  validateRegistration(
    definition: FinancialModuleDefinition,
    config: FinancialFrameworkConfiguration,
  ): FinancialValidationReport {
    const report = this.validator.validateDefinition(definition, config);
    if (!config.validationRulesEnabled) {
      return {
        ...report,
        decision: "pass",
        warnings: [...report.warnings, "Validation rules disabled by configuration"],
      };
    }
    return report;
  }

  validateRecord(
    record: FinancialFrameworkRecord,
    config: FinancialFrameworkConfiguration,
  ): FinancialValidationReport {
    const report = this.validator.validateRecord(record);
    if (!config.validationRulesEnabled) {
      return { ...report, decision: "pass" };
    }
    if (record.validationStatus === "fail") {
      report.decision = "fail";
      report.errors.push("Record validation status is fail");
    }
    return report;
  }

  validateEventRouting(
    record: FinancialFrameworkRecord | null,
    topic: string,
    config: FinancialFrameworkConfiguration,
  ): FinancialValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record) errors.push("Financial module not registered");
    else if (record.operationalState !== "active" && record.operationalState !== "initialized") {
      errors.push(`Module not routable in state: ${record.operationalState}`);
    }
    if (!topic) errors.push("Missing event topic");
    if (!config.eventRoutingRulesEnabled) {
      warnings.push("Event routing rules disabled");
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `ff-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      frameworkId: record?.frameworkId ?? null,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: FINANCIAL_METADATA_VERSION,
    };
  }
}
