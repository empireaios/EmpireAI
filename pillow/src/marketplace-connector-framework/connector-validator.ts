/** R1-01 — Connector registration and configuration validator. */

import { CONNECTOR_METADATA_VERSION } from "./paths.js";
import type { MarketplaceConnectorFrameworkConfiguration } from "./configuration.js";
import type {
  ConnectorValidationReport,
  MarketplaceConnectorDefinition,
  MarketplaceConnectorRecord,
} from "./types.js";

export class ConnectorValidator {
  validateDefinition(
    definition: MarketplaceConnectorDefinition,
    config: MarketplaceConnectorFrameworkConfiguration,
  ): ConnectorValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!definition.marketplaceId || definition.marketplaceId.trim().length === 0) {
      errors.push("Missing marketplace identifier");
    }
    if (/amazon|walmart|shopify|woocommerce|tiktok|etsy|ebay/i.test(definition.marketplaceId)) {
      const approved =
        (definition.integrationMissionId === "R1-02" && definition.marketplaceId === "amazon") ||
        (definition.integrationMissionId === "R1-06" && definition.marketplaceId === "walmart") ||
        (definition.integrationMissionId === "R1-07" && definition.marketplaceId === "etsy") ||
        (definition.integrationMissionId === "R1-08" && definition.marketplaceId === "ebay") ||
        (definition.integrationMissionId === "R1-09" && definition.marketplaceId === "tiktok-shop") ||
        (definition.integrationMissionId === "R1-10" && definition.marketplaceId === "shopify") ||
        (definition.integrationMissionId === "R1-11" && definition.marketplaceId === "woocommerce");
      if (!approved) {
        errors.push(
          "Specific marketplace integrations are out of scope for R1-01 — use template connectors or approved integration missions",
        );
      }
    }
    if (!definition.connectorVersion) errors.push("Missing connector version");
    if (!definition.apiEndpointConfig?.baseUrl) errors.push("Missing API base URL");
    if (definition.authenticationMethod !== "none" && !definition.credentialRef) {
      warnings.push("Credential reference recommended for authenticated connectors");
    }
    if (definition.supportedCapabilities.length === 0) {
      warnings.push("No supported capabilities declared");
    }
    if (!config.connectorRegistrationRulesEnabled) {
      warnings.push("Registration rules disabled by configuration");
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `mcf-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      connectorId: null,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: CONNECTOR_METADATA_VERSION,
    };
  }

  validateRecord(record: MarketplaceConnectorRecord): ConnectorValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.connectorId.startsWith("mcf-")) errors.push("Invalid connector ID prefix");
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (record.healthStatus === "failed") warnings.push("Connector health is failed");

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `mcf-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      connectorId: record.connectorId,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: CONNECTOR_METADATA_VERSION,
    };
  }
}
