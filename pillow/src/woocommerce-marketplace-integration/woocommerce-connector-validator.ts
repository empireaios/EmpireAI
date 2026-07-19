/** R1-11 — WooCommerce connector validator. */

import { WOOCOMMERCE_CONNECTOR_METADATA_VERSION } from "./paths.js";
import type { WooCommerceMarketplaceIntegrationConfiguration } from "./configuration.js";
import type { WooCommerceConnectorRecord, WooCommerceValidationReport } from "./types.js";

export class WooCommerceConnectorValidator {
  validateConfiguration(config: WooCommerceMarketplaceIntegrationConfiguration): WooCommerceValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.credentialRef?.startsWith("vault://")) {
      warnings.push("WooCommerce credential reference should use vault:// prefix");
    }
    if (!config.authenticationRulesEnabled) {
      warnings.push("Authentication rules disabled");
    }
    if (!config.webhookRulesEnabled) {
      warnings.push("Webhook rules disabled");
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `woo-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: WOOCOMMERCE_CONNECTOR_METADATA_VERSION,
    };
  }

  validateRecord(record: WooCommerceConnectorRecord): WooCommerceValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.connectorId.startsWith("woo-")) errors.push("Invalid WooCommerce connector ID prefix");
    if (record.marketplaceIdentifier !== "woocommerce") errors.push("Invalid marketplace identifier");
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (!record.credentialRefPresent && record.authenticationStatus !== "unauthenticated") {
      warnings.push("Authenticated without credential reference");
    }
    if (!record.storeId) warnings.push("Store ID not assigned");
    if (!record.storeUrl) warnings.push("Store URL not assigned");
    if (record.healthStatus === "failed") warnings.push("Connector health is failed");

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `woo-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: WOOCOMMERCE_CONNECTOR_METADATA_VERSION,
    };
  }
}
