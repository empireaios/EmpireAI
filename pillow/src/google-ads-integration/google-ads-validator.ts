/** R5-03 — Google Ads Validator. */

import { GAI_METADATA_VERSION } from "./paths.js";
import type { GoogleAdsIntegrationConfiguration } from "./configuration.js";
import type {
  CreateGoogleCampaignInput,
  GoogleAdsRecord,
  GoogleAdsEngineRecord,
  GoogleAdsValidationReport,
} from "./types.js";

export class GoogleAdsValidator {
  validateConfiguration(config: GoogleAdsIntegrationConfiguration): GoogleAdsValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.enabled) warnings.push("Google Ads Integration disabled");
    if (!config.credentialRef) errors.push("Missing credential reference");
    if (!config.validationRulesEnabled) {
      warnings.push("Validation rules disabled by configuration");
    }

    return this.build(errors, warnings, started);
  }

  validateEngineRecord(record: GoogleAdsEngineRecord): GoogleAdsValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.engineRecordId.startsWith("gai-")) errors.push("Invalid engine record ID prefix");
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (record.authenticationStatus !== "authenticated") {
      warnings.push("Google authentication not active");
    }
    if (record.healthStatus === "failed") warnings.push("Engine health is failed");

    return this.build(errors, warnings, started);
  }

  validateCampaignCreation(
    input: CreateGoogleCampaignInput,
    config: GoogleAdsIntegrationConfiguration,
  ): GoogleAdsValidationReport {
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

  validateGoogleAdsRecord(record: GoogleAdsRecord): GoogleAdsValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.googleAdsRecordId.startsWith("gai-rec-")) {
      errors.push("Invalid Google Ads record ID prefix");
    }
    if (!record.campaignReference.startsWith("gai-camp-")) {
      errors.push("Invalid campaign reference prefix");
    }
    if (!record.customerAccountId) errors.push("Missing customer account ID");
    if (record.synchronizationStatus === "failed") {
      warnings.push("Synchronization status is failed");
    }

    return this.build(errors, warnings, started);
  }

  private build(
    errors: string[],
    warnings: string[],
    started: number,
  ): GoogleAdsValidationReport {
    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";
    return {
      validationReportId: `gai-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: GAI_METADATA_VERSION,
    };
  }
}
