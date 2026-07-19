/** R2-02 — CJdropshipping connector validator. */

import { CJ_CONNECTOR_METADATA_VERSION } from "./paths.js";
import type { CjDropshippingIntegrationConfiguration } from "./configuration.js";
import type { CjConnectorRecord, CjValidationReport } from "./types.js";

export class CjValidator {
  validateConfiguration(config: CjDropshippingIntegrationConfiguration): CjValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.credentialRef?.startsWith("vault://")) {
      warnings.push("CJdropshipping credential reference should use vault:// prefix");
    }
    if (!config.authenticationRulesEnabled) {
      warnings.push("Authentication rules disabled");
    }
    if (!config.apiEndpointRulesEnabled) {
      warnings.push("API endpoint rules disabled");
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `cj-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: CJ_CONNECTOR_METADATA_VERSION,
    };
  }

  validateRecord(record: CjConnectorRecord): CjValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.connectorId.startsWith("cj-")) errors.push("Invalid CJ connector ID prefix");
    if (record.supplierId !== "cj-dropshipping") errors.push("Invalid supplier identifier");
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (!record.credentialRefPresent && record.authenticationStatus !== "unauthenticated") {
      warnings.push("Authenticated without credential reference");
    }
    if (record.healthStatus === "failed") warnings.push("Connector health is failed");

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `cj-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: CJ_CONNECTOR_METADATA_VERSION,
    };
  }
}
