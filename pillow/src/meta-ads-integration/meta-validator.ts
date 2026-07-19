/** R5-02 — Meta Validator. */

import { MAI_METADATA_VERSION } from "./paths.js";
import type { MetaAdsIntegrationConfiguration } from "./configuration.js";
import type {
  CreateCampaignInput,
  MetaAdsRecord,
  MetaEngineRecord,
  MetaValidationReport,
} from "./types.js";

export class MetaValidator {
  validateConfiguration(config: MetaAdsIntegrationConfiguration): MetaValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.enabled) warnings.push("Meta Ads Integration disabled");
    if (!config.credentialRef) errors.push("Missing credential reference");
    if (!config.validationRulesEnabled) {
      warnings.push("Validation rules disabled by configuration");
    }

    return this.build(errors, warnings, started);
  }

  validateEngineRecord(record: MetaEngineRecord): MetaValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.engineRecordId.startsWith("mai-")) errors.push("Invalid engine record ID prefix");
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (record.authenticationStatus !== "authenticated") {
      warnings.push("Meta authentication not active");
    }
    if (record.healthStatus === "failed") warnings.push("Engine health is failed");

    return this.build(errors, warnings, started);
  }

  validateCampaignCreation(
    input: CreateCampaignInput,
    config: MetaAdsIntegrationConfiguration,
  ): MetaValidationReport {
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

  validateMetaRecord(record: MetaAdsRecord): MetaValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.metaRecordId.startsWith("mai-rec-")) errors.push("Invalid meta record ID prefix");
    if (!record.campaignReference.startsWith("mai-camp-")) {
      errors.push("Invalid campaign reference prefix");
    }
    if (!record.businessAccountId) errors.push("Missing business account ID");
    if (!record.adAccountId) errors.push("Missing ad account ID");
    if (record.synchronizationStatus === "failed") {
      warnings.push("Synchronization status is failed");
    }

    return this.build(errors, warnings, started);
  }

  private build(
    errors: string[],
    warnings: string[],
    started: number,
  ): MetaValidationReport {
    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";
    return {
      validationReportId: `mai-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: MAI_METADATA_VERSION,
    };
  }
}
