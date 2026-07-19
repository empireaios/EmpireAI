/** R1-08 — eBay connector validator. */

import { EBAY_CONNECTOR_METADATA_VERSION } from "./paths.js";
import type { EbayMarketplaceIntegrationConfiguration } from "./configuration.js";
import type { EbayConnectorRecord, EbayValidationReport } from "./types.js";

export class EbayConnectorValidator {
  validateConfiguration(config: EbayMarketplaceIntegrationConfiguration): EbayValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.credentialRef?.startsWith("vault://")) {
      warnings.push("eBay credential reference should use vault:// prefix");
    }
    if (!config.authenticationRulesEnabled) {
      warnings.push("Authentication rules disabled");
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `ebay-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: EBAY_CONNECTOR_METADATA_VERSION,
    };
  }

  validateRecord(record: EbayConnectorRecord): EbayValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.connectorId.startsWith("ebay-")) errors.push("Invalid eBay connector ID prefix");
    if (record.marketplaceIdentifier !== "ebay") errors.push("Invalid marketplace identifier");
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (!record.credentialRefPresent && record.authenticationStatus !== "unauthenticated") {
      warnings.push("Authenticated without credential reference");
    }
    if (record.healthStatus === "failed") warnings.push("Connector health is failed");

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `ebay-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: EBAY_CONNECTOR_METADATA_VERSION,
    };
  }
}
