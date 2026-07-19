/** X1-01 — Marketing validation engine. */

import { COMPANY_FACTORY_METADATA_VERSION } from "./paths.js";
import type { CompanyFactoryFrameworkConfiguration } from "./configuration.js";
import type {
  CompanyFactoryFrameworkRecord,
  CompanyModuleDefinition,
  CompanyValidationReport,
} from "./types.js";
import { CompanyValidator } from "./company-validator.js";

export class CompanyValidationEngine {
  private readonly validator = new CompanyValidator();

  validateRegistration(
    definition: CompanyModuleDefinition,
    config: CompanyFactoryFrameworkConfiguration,
  ): CompanyValidationReport {
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
    record: CompanyFactoryFrameworkRecord,
    config: CompanyFactoryFrameworkConfiguration,
  ): CompanyValidationReport {
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
    record: CompanyFactoryFrameworkRecord | null,
    topic: string,
    config: CompanyFactoryFrameworkConfiguration,
  ): CompanyValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record) errors.push("Company module not registered");
    else if (record.operationalState !== "active" && record.operationalState !== "initialized") {
      errors.push(`Module not routable in state: ${record.operationalState}`);
    }
    if (!topic) errors.push("Missing event topic");
    if (!config.eventRoutingRulesEnabled) {
      warnings.push("Event routing rules disabled");
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `cff-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      frameworkId: record?.frameworkId ?? null,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: COMPANY_FACTORY_METADATA_VERSION,
    };
  }
}
