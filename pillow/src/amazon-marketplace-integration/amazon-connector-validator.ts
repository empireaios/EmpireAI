/** R1-02 — Amazon connector validator. */

import { AMAZON_CONNECTOR_METADATA_VERSION } from "./paths.js";
import type { AmazonMarketplaceIntegrationConfiguration } from "./configuration.js";
import type { AmazonConnectorRecord, AmazonValidationReport } from "./types.js";

export class AmazonConnectorValidator {
  validateConfiguration(config: AmazonMarketplaceIntegrationConfiguration): AmazonValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.credentialRef?.startsWith("vault://")) {
      warnings.push("Amazon credential reference should use vault:// prefix");
    }
    if (!config.authenticationRulesEnabled) {
      warnings.push("Authentication rules disabled");
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `amz-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: AMAZON_CONNECTOR_METADATA_VERSION,
    };
  }

  validateRecord(record: AmazonConnectorRecord): AmazonValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.connectorId.startsWith("amz-")) errors.push("Invalid Amazon connector ID prefix");
    if (record.marketplaceIdentifier !== "amazon") errors.push("Invalid marketplace identifier");
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (!record.credentialRefPresent && record.authenticationStatus !== "unauthenticated") {
      warnings.push("Authenticated without credential reference");
    }
    if (record.healthStatus === "failed") warnings.push("Connector health is failed");

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `amz-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: AMAZON_CONNECTOR_METADATA_VERSION,
    };
  }
}
