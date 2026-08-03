/** X2-01 — Portfolio validation engine. */

import { EPF_METADATA_VERSION } from "./paths.js";
import type { EnterprisePortfolioFrameworkConfiguration } from "./configuration.js";
import type {
  EnterprisePortfolioFrameworkRecord,
  PortfolioModuleDefinition,
  PortfolioValidationReport,
} from "./types.js";
import { PortfolioValidator } from "./portfolio-validator.js";

export class PortfolioValidationEngine {
  private readonly validator = new PortfolioValidator();

  validateRegistration(
    definition: PortfolioModuleDefinition,
    config: EnterprisePortfolioFrameworkConfiguration,
  ): PortfolioValidationReport {
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
    record: EnterprisePortfolioFrameworkRecord,
    config: EnterprisePortfolioFrameworkConfiguration,
  ): PortfolioValidationReport {
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

  validateCompany(
    companyReference: string,
    config: EnterprisePortfolioFrameworkConfiguration,
  ): PortfolioValidationReport {
    const report = this.validator.validateCompanyReference(companyReference, config);
    if (!config.validationRulesEnabled) {
      return {
        ...report,
        decision: "pass",
        warnings: [...report.warnings, "Validation rules disabled by configuration"],
      };
    }
    return report;
  }

  validateEventRouting(
    record: EnterprisePortfolioFrameworkRecord | null,
    topic: string,
    config: EnterprisePortfolioFrameworkConfiguration,
  ): PortfolioValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record) errors.push("Portfolio module not registered");
    else if (record.operationalState !== "active" && record.operationalState !== "initialized") {
      errors.push(`Module not routable in state: ${record.operationalState}`);
    }
    if (!topic) errors.push("Missing event topic");
    if (!config.eventRoutingRulesEnabled) {
      warnings.push("Event routing rules disabled");
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `epf-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      portfolioFrameworkId: record?.portfolioFrameworkId ?? null,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: EPF_METADATA_VERSION,
    };
  }
}
