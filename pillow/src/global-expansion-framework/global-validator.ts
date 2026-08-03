/** X4-01 — Expansion module validator. */

import { GEF_METADATA_VERSION } from "./paths.js";
import type { GlobalExpansionFrameworkConfiguration } from "./configuration.js";
import type {
  GlobalExpansionFrameworkRecord,
  ExpansionModuleDefinition,
  ExpansionValidationReport,
} from "./types.js";

/** Later Global Expansion missions — out of scope for X4-01 unless approved mission id. */
export const RESERVED_EXPANSION_MODULES = [
  { id: "country-intelligence-engine", mission: "X4-02" },
  { id: "localization-engine", mission: "X4-03" },
  { id: "language-intelligence", mission: "X4-04" },
  { id: "currency-intelligence", mission: "X4-05" },
  { id: "regional-compliance-engine", mission: "X4-06" },
  { id: "global-tax-intelligence", mission: "X4-07" },
  { id: "international-logistics-engine", mission: "X4-08" },
  { id: "global-market-intelligence", mission: "X4-09" },
  { id: "executive-global-dashboard", mission: "X4-10" },
  { id: "global-brand-management", mission: "X4-11" },
  { id: "international-partnership-engine", mission: "X4-12" },
  { id: "global-talent-intelligence", mission: "X4-13" },
  { id: "regional-growth-optimizer", mission: "X4-14" },
  { id: "global-risk-intelligence", mission: "X4-15" },
  { id: "cross-region-learning-engine", mission: "X4-16" },
  { id: "global-expansion-simulator", mission: "X4-17" },
  { id: "international-executive-cockpit", mission: "X4-18" },
  { id: "global-operations-certified", mission: "X4-19" },
];

export class GlobalValidator {
  validateDefinition(
    definition: ExpansionModuleDefinition,
    config: GlobalExpansionFrameworkConfiguration,
  ): ExpansionValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (
      !definition.expansionModuleIdentifier ||
      definition.expansionModuleIdentifier.trim().length === 0
    ) {
      errors.push("Missing expansion module identifier");
    }

    for (const reserved of RESERVED_EXPANSION_MODULES) {
      if (definition.expansionModuleIdentifier === reserved.id) {
        const approved = definition.integrationMissionId === reserved.mission;
        if (!approved) {
          errors.push(
            "Specific expansion integrations are out of scope for X4-01 — use template modules or approved integration missions",
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
    if (!config.preserveModuleIsolation) {
      errors.push("Module isolation must remain enabled");
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `gef-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      expansionFrameworkId: null,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: GEF_METADATA_VERSION,
    };
  }

  validateRecord(record: GlobalExpansionFrameworkRecord): ExpansionValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.expansionFrameworkId.startsWith("gef-")) {
      errors.push("Invalid expansion framework ID prefix");
    }
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (record.bypassedValidation) errors.push("Validation bypass is forbidden");
    if (record.healthStatus === "failed") warnings.push("Module health is failed");

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `gef-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      expansionFrameworkId: record.expansionFrameworkId,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: GEF_METADATA_VERSION,
    };
  }
}
