/** R1-10 — Shopify connector validator. */

import { SHOPIFY_STORE_CONNECTOR_METADATA_VERSION } from "./paths.js";
import type { ShopifyStoreMarketplaceIntegrationConfiguration } from "./configuration.js";
import type { ShopifyStoreConnectorRecord, ShopifyStoreValidationReport } from "./types.js";

export class ShopifyStoreConnectorValidator {
  validateConfiguration(config: ShopifyStoreMarketplaceIntegrationConfiguration): ShopifyStoreValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.credentialRef?.startsWith("vault://")) {
      warnings.push("Shopify credential reference should use vault:// prefix");
    }
    if (!config.authenticationRulesEnabled) {
      warnings.push("Authentication rules disabled");
    }
    if (!config.webhookRulesEnabled) {
      warnings.push("Webhook rules disabled");
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `shf-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: SHOPIFY_STORE_CONNECTOR_METADATA_VERSION,
    };
  }

  validateRecord(record: ShopifyStoreConnectorRecord): ShopifyStoreValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.connectorId.startsWith("shf-")) errors.push("Invalid Shopify connector ID prefix");
    if (record.marketplaceIdentifier !== "shopify") errors.push("Invalid marketplace identifier");
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (!record.credentialRefPresent && record.authenticationStatus !== "unauthenticated") {
      warnings.push("Authenticated without credential reference");
    }
    if (!record.storeId) warnings.push("Store ID not assigned");
    if (!record.storeDomain) warnings.push("Store domain not assigned");
    if (record.healthStatus === "failed") warnings.push("Connector health is failed");

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `shf-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: SHOPIFY_STORE_CONNECTOR_METADATA_VERSION,
    };
  }
}
