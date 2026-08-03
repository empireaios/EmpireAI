/** X2-01 — Portfolio module validator. */

import { EPF_METADATA_VERSION } from "./paths.js";
import type { EnterprisePortfolioFrameworkConfiguration } from "./configuration.js";
import type {
  EnterprisePortfolioFrameworkRecord,
  PortfolioModuleDefinition,
  PortfolioValidationReport,
} from "./types.js";

/** Later Portfolio Intelligence missions — out of scope for X2-01 unless approved mission id. */
const RESERVED_PORTFOLIO_MODULES = [
  { id: "multi-company-registry", mission: "X2-02" },
  { id: "portfolio-performance-engine", mission: "X2-03" },
  { id: "cross-business-knowledge-engine", mission: "X2-04" },
  { id: "capital-distribution-engine", mission: "X2-05" },
  { id: "executive-portfolio-dashboard", mission: "X2-06" },
  { id: "portfolio-risk-engine", mission: "X2-07" },
  { id: "portfolio-balance-engine", mission: "X2-08" },
  { id: "business-health-ranking", mission: "X2-09" },
  { id: "portfolio-intelligence-certified", mission: "X2-10" },
  { id: "cross-company-resource-engine", mission: "X2-11" },
  { id: "shared-customer-intelligence", mission: "X2-12" },
  { id: "shared-supplier-intelligence", mission: "X2-13" },
  { id: "portfolio-forecast-engine", mission: "X2-14" },
  { id: "acquisition-evaluation-engine", mission: "X2-15" },
  { id: "portfolio-optimization-engine", mission: "X2-16" },
  { id: "company-lifecycle-manager", mission: "X2-17" },
  { id: "portfolio-expansion-planner", mission: "X2-18" },
  { id: "enterprise-value-engine", mission: "X2-19" },
  { id: "autonomous-portfolio-board", mission: "X2-20" },
  { id: "portfolio-certified", mission: "X2-21" },
];

export class PortfolioValidator {
  validateDefinition(
    definition: PortfolioModuleDefinition,
    config: EnterprisePortfolioFrameworkConfiguration,
  ): PortfolioValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (
      !definition.portfolioModuleIdentifier ||
      definition.portfolioModuleIdentifier.trim().length === 0
    ) {
      errors.push("Missing portfolio module identifier");
    }

    for (const reserved of RESERVED_PORTFOLIO_MODULES) {
      if (definition.portfolioModuleIdentifier === reserved.id) {
        const approved = definition.integrationMissionId === reserved.mission;
        if (!approved) {
          errors.push(
            "Specific portfolio integrations are out of scope for X2-01 — use template modules or approved integration missions",
          );
        }
      }
    }

    if (!definition.moduleVersion) errors.push("Missing module version");
    if (definition.supportedCapabilities.length === 0) {
      warnings.push("No supported capabilities declared");
    }
    if (!config.moduleRegistrationRulesEnabled) {
      warnings.push("Registration rules disabled by configuration");
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `epf-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      portfolioFrameworkId: null,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: EPF_METADATA_VERSION,
    };
  }

  validateRecord(record: EnterprisePortfolioFrameworkRecord): PortfolioValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.portfolioFrameworkId.startsWith("epf-")) {
      errors.push("Invalid portfolio framework ID prefix");
    }
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (record.bypassedValidation) errors.push("Validation bypass is forbidden");
    if (record.healthStatus === "failed") warnings.push("Module health is failed");

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `epf-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      portfolioFrameworkId: record.portfolioFrameworkId,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: EPF_METADATA_VERSION,
    };
  }

  validateCompanyReference(
    companyReference: string,
    config: EnterprisePortfolioFrameworkConfiguration,
  ): PortfolioValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!companyReference || companyReference.trim().length === 0) {
      errors.push("Missing company reference");
    }
    if (/(token|secret|password|credential)/i.test(companyReference)) {
      errors.push("Company reference must not contain credentials");
    }
    if (!config.preservePortfolioIsolation) {
      errors.push("Portfolio isolation must remain enabled");
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `epf-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      portfolioFrameworkId: null,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: EPF_METADATA_VERSION,
    };
  }
}
