/** R1-09 — TikTok Shop connector validator. */

import { TIKTOK_SHOP_CONNECTOR_METADATA_VERSION } from "./paths.js";
import type { TikTokShopMarketplaceIntegrationConfiguration } from "./configuration.js";
import type { TikTokShopConnectorRecord, TikTokShopValidationReport } from "./types.js";

export class TikTokShopConnectorValidator {
  validateConfiguration(config: TikTokShopMarketplaceIntegrationConfiguration): TikTokShopValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.credentialRef?.startsWith("vault://")) {
      warnings.push("TikTok Shop credential reference should use vault:// prefix");
    }
    if (!config.authenticationRulesEnabled) {
      warnings.push("Authentication rules disabled");
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `tts-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: TIKTOK_SHOP_CONNECTOR_METADATA_VERSION,
    };
  }

  validateRecord(record: TikTokShopConnectorRecord): TikTokShopValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.connectorId.startsWith("tts-")) errors.push("Invalid TikTok Shop connector ID prefix");
    if (record.marketplaceIdentifier !== "tiktok-shop") errors.push("Invalid marketplace identifier");
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (!record.credentialRefPresent && record.authenticationStatus !== "unauthenticated") {
      warnings.push("Authenticated without credential reference");
    }
    if (!record.shopId) warnings.push("Shop ID not assigned");
    if (record.healthStatus === "failed") warnings.push("Connector health is failed");

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `tts-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: TIKTOK_SHOP_CONNECTOR_METADATA_VERSION,
    };
  }
}
