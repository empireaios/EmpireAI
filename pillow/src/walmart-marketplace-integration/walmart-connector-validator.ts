/** R1-06 — Walmart connector validator. */

import { WALMART_CONNECTOR_METADATA_VERSION } from "./paths.js";
import type { WalmartMarketplaceIntegrationConfiguration } from "./configuration.js";
import type { WalmartConnectorRecord, WalmartValidationReport } from "./types.js";

export class WalmartConnectorValidator {
  validateConfiguration(config: WalmartMarketplaceIntegrationConfiguration): WalmartValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.credentialRef?.startsWith("vault://")) {
      warnings.push("Walmart credential reference should use vault:// prefix");
    }
    if (!config.authenticationRulesEnabled) {
      warnings.push("Authentication rules disabled");
    }
    if (!config.apiEndpointRulesEnabled) {
      warnings.push("API endpoint rules disabled");
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `wmt-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: WALMART_CONNECTOR_METADATA_VERSION,
    };
  }

  validateRecord(record: WalmartConnectorRecord): WalmartValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.connectorId.startsWith("wmt-")) errors.push("Invalid Walmart connector ID prefix");
    if (record.marketplaceId !== "walmart") errors.push("Invalid marketplace identifier");
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (!record.credentialRefPresent && record.authenticationStatus !== "unauthenticated") {
      warnings.push("Authenticated without credential reference");
    }
    if (record.healthStatus === "failed") warnings.push("Connector health is failed");

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `wmt-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: WALMART_CONNECTOR_METADATA_VERSION,
    };
  }
}
