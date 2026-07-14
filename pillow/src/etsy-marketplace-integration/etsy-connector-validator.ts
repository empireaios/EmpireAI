/** R1-07 — Etsy connector validator. */

import { ETSY_CONNECTOR_METADATA_VERSION } from "./paths.js";
import type { EtsyMarketplaceIntegrationConfiguration } from "./configuration.js";
import type { EtsyConnectorRecord, EtsyValidationReport } from "./types.js";

export class EtsyConnectorValidator {
  validateConfiguration(config: EtsyMarketplaceIntegrationConfiguration): EtsyValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.credentialRef?.startsWith("vault://")) {
      warnings.push("Etsy credential reference should use vault:// prefix");
    }
    if (!config.authenticationRulesEnabled) {
      warnings.push("Authentication rules disabled");
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `etsy-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: ETSY_CONNECTOR_METADATA_VERSION,
    };
  }

  validateRecord(record: EtsyConnectorRecord): EtsyValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.connectorId.startsWith("etsy-")) errors.push("Invalid Etsy connector ID prefix");
    if (record.marketplaceIdentifier !== "etsy") errors.push("Invalid marketplace identifier");
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (!record.credentialRefPresent && record.authenticationStatus !== "unauthenticated") {
      warnings.push("Authenticated without credential reference");
    }
    if (record.healthStatus === "failed") warnings.push("Connector health is failed");

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `etsy-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: ETSY_CONNECTOR_METADATA_VERSION,
    };
  }
}
