/** R5-04 — TikTok Ads Validator. */

import { TAI_METADATA_VERSION } from "./paths.js";
import type { TikTokAdsIntegrationConfiguration } from "./configuration.js";
import type {
  CreateTikTokCampaignInput,
  TikTokAdsRecord,
  TikTokAdsEngineRecord,
  TikTokAdsValidationReport,
} from "./types.js";

export class TikTokAdsValidator {
  validateConfiguration(config: TikTokAdsIntegrationConfiguration): TikTokAdsValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.enabled) warnings.push("TikTok Ads Integration disabled");
    if (!config.credentialRef) errors.push("Missing credential reference");
    if (!config.validationRulesEnabled) {
      warnings.push("Validation rules disabled by configuration");
    }

    return this.build(errors, warnings, started);
  }

  validateEngineRecord(record: TikTokAdsEngineRecord): TikTokAdsValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.engineRecordId.startsWith("tai-")) errors.push("Invalid engine record ID prefix");
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (record.authenticationStatus !== "authenticated") {
      warnings.push("TikTok authentication not active");
    }
    if (record.healthStatus === "failed") warnings.push("Engine health is failed");

    return this.build(errors, warnings, started);
  }

  validateCampaignCreation(
    input: CreateTikTokCampaignInput,
    config: TikTokAdsIntegrationConfiguration,
  ): TikTokAdsValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.validationRulesEnabled) {
      return this.build([], ["Validation rules disabled"], started);
    }
    if (!input.campaignName || input.campaignName.trim().length === 0) {
      errors.push("Campaign name is required");
    }
    if (input.campaignName && input.campaignName.length > 200) {
      errors.push("Campaign name exceeds maximum length");
    }

    return this.build(errors, warnings, started);
  }

  validateTikTokAdsRecord(record: TikTokAdsRecord): TikTokAdsValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.tiktokAdsRecordId.startsWith("tai-rec-")) {
      errors.push("Invalid TikTok Ads record ID prefix");
    }
    if (!record.campaignReference.startsWith("tai-camp-")) {
      errors.push("Invalid campaign reference prefix");
    }
    if (!record.advertiserAccountId) errors.push("Missing advertiser account ID");
    if (record.synchronizationStatus === "failed") {
      warnings.push("Synchronization status is failed");
    }

    return this.build(errors, warnings, started);
  }

  private build(
    errors: string[],
    warnings: string[],
    started: number,
  ): TikTokAdsValidationReport {
    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";
    return {
      validationReportId: `tai-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: TAI_METADATA_VERSION,
    };
  }
}
