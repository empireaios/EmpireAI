/** R5-05 — YouTube Ads Validator. */

import { YAI_METADATA_VERSION } from "./paths.js";
import type { YouTubeAdsIntegrationConfiguration } from "./configuration.js";
import type {
  CreateYouTubeCampaignInput,
  CreateVideoAdvertisementInput,
  ManageVideoAssetInput,
  YouTubeAdsRecord,
  YouTubeAdsEngineRecord,
  YouTubeAdsValidationReport,
} from "./types.js";

export class YouTubeAdsValidator {
  validateConfiguration(config: YouTubeAdsIntegrationConfiguration): YouTubeAdsValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.enabled) warnings.push("YouTube Ads Integration disabled");
    if (!config.credentialRef) errors.push("Missing credential reference");
    if (!config.validationRulesEnabled) {
      warnings.push("Validation rules disabled by configuration");
    }

    return this.build(errors, warnings, started);
  }

  validateEngineRecord(record: YouTubeAdsEngineRecord): YouTubeAdsValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.engineRecordId.startsWith("yai-")) errors.push("Invalid engine record ID prefix");
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (record.authenticationStatus !== "authenticated") {
      warnings.push("Google authentication not active");
    }
    if (!record.googleAdsDependencyPresent) {
      warnings.push("Google Ads Integration dependency not present");
    }
    if (record.healthStatus === "failed") warnings.push("Engine health is failed");

    return this.build(errors, warnings, started);
  }

  validateCampaignCreation(
    input: CreateYouTubeCampaignInput,
    config: YouTubeAdsIntegrationConfiguration,
  ): YouTubeAdsValidationReport {
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

  validateVideoAsset(
    input: ManageVideoAssetInput,
    config: YouTubeAdsIntegrationConfiguration,
  ): YouTubeAdsValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.videoAssetRulesEnabled) {
      return this.build([], ["Video asset rules disabled"], started);
    }
    if (!input.videoAssetName || input.videoAssetName.trim().length === 0) {
      errors.push("Video asset name is required");
    }
    if (input.durationSeconds !== undefined && input.durationSeconds <= 0) {
      errors.push("Video asset duration must be positive");
    }

    return this.build(errors, warnings, started);
  }

  validateVideoAdvertisement(
    input: CreateVideoAdvertisementInput,
    config: YouTubeAdsIntegrationConfiguration,
  ): YouTubeAdsValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.validationRulesEnabled) {
      return this.build([], ["Validation rules disabled"], started);
    }
    if (!input.advertisementName?.trim()) errors.push("Advertisement name is required");
    if (!input.videoAssetReference?.startsWith("yai-vid-")) {
      errors.push("Valid video asset reference is required");
    }
    if (!input.campaignReference?.startsWith("yai-camp-")) {
      errors.push("Valid campaign reference is required");
    }

    return this.build(errors, warnings, started);
  }

  validateYouTubeAdsRecord(record: YouTubeAdsRecord): YouTubeAdsValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.youtubeAdsRecordId.startsWith("yai-rec-")) {
      errors.push("Invalid YouTube Ads record ID prefix");
    }
    if (!record.campaignReference.startsWith("yai-camp-")) {
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
  ): YouTubeAdsValidationReport {
    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";
    return {
      validationReportId: `yai-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: YAI_METADATA_VERSION,
    };
  }
}
