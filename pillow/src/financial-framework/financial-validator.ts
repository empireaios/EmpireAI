/** R3-01 — Financial module validator. */

import { FINANCIAL_METADATA_VERSION } from "./paths.js";
import type { FinancialFrameworkConfiguration } from "./configuration.js";
import type {
  FinancialFrameworkRecord,
  FinancialModuleDefinition,
  FinancialValidationReport,
} from "./types.js";

const RESERVED_FINANCIAL_MODULES = [
  { id: "payment-gateway", mission: "R3-02" },
  { id: "banking-integration", mission: "R3-03" },
  { id: "revenue-engine", mission: "R3-04" },
  { id: "expense-engine", mission: "R3-05" },
  { id: "profit-calculation-engine", mission: "R3-06" },
  { id: "cash-flow-monitor", mission: "R3-07" },
  { id: "reconciliation-engine", mission: "R3-08" },
  { id: "invoice-generator", mission: "R3-09" },
  { id: "refund-engine", mission: "R3-10" },
  { id: "tax-intelligence-engine", mission: "R3-11" },
  { id: "multi-currency-engine", mission: "R3-12" },
  { id: "financial-forecast-engine", mission: "R3-13" },
  { id: "budget-management-engine", mission: "R3-14" },
  { id: "financial-risk-monitor", mission: "R3-15" },
  { id: "executive-financial-dashboard", mission: "R3-16" },
  { id: "accounting-export-engine", mission: "R3-17" },
  { id: "financial-operations-certified", mission: "R3-18" },
];

export class FinancialValidator {
  validateDefinition(
    definition: FinancialModuleDefinition,
    config: FinancialFrameworkConfiguration,
  ): FinancialValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (
      !definition.financialModuleIdentifier ||
      definition.financialModuleIdentifier.trim().length === 0
    ) {
      errors.push("Missing financial module identifier");
    }

    for (const reserved of RESERVED_FINANCIAL_MODULES) {
      if (definition.financialModuleIdentifier === reserved.id) {
        const approved = definition.integrationMissionId === reserved.mission;
        if (!approved) {
          errors.push(
            "Specific financial integrations are out of scope for R3-01 — use template modules or approved integration missions",
          );
        }
      }
    }

    if (!definition.moduleVersion) errors.push("Missing module version");
    if (!definition.apiEndpointConfig?.baseUrl) errors.push("Missing API base URL");
    if (definition.authenticationMethod !== "none" && !definition.credentialRef) {
      warnings.push("Credential reference recommended for authenticated financial modules");
    }
    if (definition.supportedCapabilities.length === 0) {
      warnings.push("No supported capabilities declared");
    }
    if (!config.moduleRegistrationRulesEnabled) {
      warnings.push("Registration rules disabled by configuration");
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `ff-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      frameworkId: null,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: FINANCIAL_METADATA_VERSION,
    };
  }

  validateRecord(record: FinancialFrameworkRecord): FinancialValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.frameworkId.startsWith("ff-")) errors.push("Invalid framework ID prefix");
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (record.healthStatus === "failed") warnings.push("Module health is failed");

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `ff-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      frameworkId: record.frameworkId,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: FINANCIAL_METADATA_VERSION,
    };
  }
}
