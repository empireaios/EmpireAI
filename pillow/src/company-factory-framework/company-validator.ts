/** X1-01 — Company module validator. */

import { COMPANY_FACTORY_METADATA_VERSION } from "./paths.js";
import type { CompanyFactoryFrameworkConfiguration } from "./configuration.js";
import type {
  CompanyFactoryFrameworkRecord,
  CompanyModuleDefinition,
  CompanyValidationReport,
} from "./types.js";

const RESERVED_COMPANY_MODULES = [
  { id: "business-opportunity-discovery", mission: "X1-02" },
  { id: "market-validation-engine", mission: "X1-03" },
  { id: "business-model-generator", mission: "X1-04" },
  { id: "brand-creation-engine", mission: "X1-05" },
  { id: "domain-digital-asset-planner", mission: "X1-06" },
  { id: "store-generation-engine", mission: "X1-07" },
  { id: "product-portfolio-builder", mission: "X1-08" },
  { id: "pricing-strategy-engine", mission: "X1-09" },
  { id: "launch-readiness-validator", mission: "X1-10" },
  { id: "business-launch-orchestrator", mission: "X1-11" },
  { id: "growth-initialization-engine", mission: "X1-12" },
  { id: "launch-monitoring-engine", mission: "X1-13" },
  { id: "first-revenue-optimizer", mission: "X1-14" },
  { id: "company-factory-certified", mission: "X1-15" },
];

export class CompanyValidator {
  validateDefinition(
    definition: CompanyModuleDefinition,
    config: CompanyFactoryFrameworkConfiguration,
  ): CompanyValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (
      !definition.companyModuleIdentifier ||
      definition.companyModuleIdentifier.trim().length === 0
    ) {
      errors.push("Missing company module identifier");
    }

    for (const reserved of RESERVED_COMPANY_MODULES) {
      if (definition.companyModuleIdentifier === reserved.id) {
        const approved = definition.integrationMissionId === reserved.mission;
        if (!approved) {
          errors.push(
            "Specific company integrations are out of scope for X1-01 — use template modules or approved integration missions",
          );
        }
      }
    }

    if (!definition.moduleVersion) errors.push("Missing module version");
    if (!definition.apiEndpointConfig?.baseUrl) errors.push("Missing API base URL");
    if (definition.authenticationMethod !== "none" && !definition.credentialRef) {
      warnings.push("Credential reference recommended for authenticated company modules");
    }
    if (definition.supportedCapabilities.length === 0) {
      warnings.push("No supported capabilities declared");
    }
    if (!config.moduleRegistrationRulesEnabled) {
      warnings.push("Registration rules disabled by configuration");
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `cff-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      frameworkId: null,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: COMPANY_FACTORY_METADATA_VERSION,
    };
  }

  validateRecord(record: CompanyFactoryFrameworkRecord): CompanyValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.frameworkId.startsWith("cff-")) errors.push("Invalid framework ID prefix");
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (record.healthStatus === "failed") warnings.push("Module health is failed");

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `cff-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      frameworkId: record.frameworkId,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: COMPANY_FACTORY_METADATA_VERSION,
    };
  }
}
