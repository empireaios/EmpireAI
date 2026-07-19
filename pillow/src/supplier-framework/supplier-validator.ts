/** R2-01 — Supplier connector validator. */

import { SUPPLIER_METADATA_VERSION } from "./paths.js";
import type { SupplierFrameworkConfiguration } from "./configuration.js";
import type {
  SupplierConnectorDefinition,
  SupplierFrameworkRecord,
  SupplierValidationReport,
} from "./types.js";

const RESERVED_SUPPLIERS = [
  { id: "cj-dropshipping", mission: "R2-02" },
  { id: "cjdropshipping", mission: "R2-02" },
  { id: "aliexpress", mission: "R2-03" },
  { id: "1688", mission: "R2-04" },
];

export class SupplierValidator {
  validateDefinition(
    definition: SupplierConnectorDefinition,
    config: SupplierFrameworkConfiguration,
  ): SupplierValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!definition.supplierIdentifier || definition.supplierIdentifier.trim().length === 0) {
      errors.push("Missing supplier identifier");
    }

    for (const reserved of RESERVED_SUPPLIERS) {
      if (definition.supplierIdentifier === reserved.id) {
        const approved = definition.integrationMissionId === reserved.mission;
        if (!approved) {
          errors.push(
            "Specific supplier integrations are out of scope for R2-01 — use template connectors or approved integration missions",
          );
        }
      }
    }

    if (!definition.connectorVersion) errors.push("Missing connector version");
    if (!definition.apiEndpointConfig?.baseUrl) errors.push("Missing API base URL");
    if (definition.authenticationMethod !== "none" && !definition.credentialRef) {
      warnings.push("Credential reference recommended for authenticated suppliers");
    }
    if (definition.supportedCapabilities.length === 0) {
      warnings.push("No supported capabilities declared");
    }
    if (!config.supplierRegistrationRulesEnabled) {
      warnings.push("Registration rules disabled by configuration");
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `sf-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      frameworkId: null,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: SUPPLIER_METADATA_VERSION,
    };
  }

  validateRecord(record: SupplierFrameworkRecord): SupplierValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.frameworkId.startsWith("sf-")) errors.push("Invalid framework ID prefix");
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (record.healthStatus === "failed") warnings.push("Supplier health is failed");

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `sf-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      frameworkId: record.frameworkId,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: SUPPLIER_METADATA_VERSION,
    };
  }
}
