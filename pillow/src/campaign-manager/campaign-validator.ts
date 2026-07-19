/** R5-07 — Campaign Validator. */

import { CAM_METADATA_VERSION, MARKETING_CHANNELS } from "./paths.js";
import type { CampaignManagerConfiguration } from "./configuration.js";
import type {
  CampaignEngineRecord,
  CampaignRecord,
  CampaignValidationReport,
  CreateCampaignInput,
} from "./types.js";

export class CampaignValidator {
  validateConfiguration(config: CampaignManagerConfiguration): CampaignValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.enabled) warnings.push("Campaign Manager disabled");
    if (!config.validationRulesEnabled) {
      warnings.push("Validation rules disabled by configuration");
    }
    if (!config.requireApprovalBeforeLaunch) {
      errors.push("Campaigns must require approval before launch");
    }

    return this.build(errors, warnings, started);
  }

  validateEngineRecord(record: CampaignEngineRecord): CampaignValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.engineRecordId.startsWith("cam-")) errors.push("Invalid engine record ID prefix");
    if (!record.metadataVersion) errors.push("Missing metadata version");

    const connected = Object.values(record.channelDependencies).filter(Boolean).length;
    if (connected === 0) {
      warnings.push("No channel dependencies connected");
    }

    return this.build(errors, warnings, started);
  }

  validateCampaignCreation(
    input: CreateCampaignInput,
    config: CampaignManagerConfiguration,
    existingNames: Set<string>,
  ): CampaignValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.validationRulesEnabled) {
      return this.build([], ["Validation rules disabled"], started);
    }
    if (!input.campaignName?.trim()) errors.push("Campaign name is required");
    if (existingNames.has(input.campaignName.trim().toLowerCase())) {
      errors.push("Duplicate campaign request — campaign name already exists");
    }
    if (!input.marketingChannels || input.marketingChannels.length === 0) {
      errors.push("At least one marketing channel is required");
    }
    for (const channel of input.marketingChannels ?? []) {
      if (!(MARKETING_CHANNELS as readonly string[]).includes(channel)) {
        errors.push(`Unsupported marketing channel: ${channel}`);
      }
    }
    if (!input.campaignObjective) errors.push("Campaign objective is required");

    return this.build(errors, warnings, started);
  }

  validateCampaignRecord(record: CampaignRecord): CampaignValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.campaignId.startsWith("cam-camp-")) {
      errors.push("Invalid campaign ID prefix");
    }
    if (!record.campaignName) errors.push("Missing campaign name");
    if (record.marketingChannels.length === 0) errors.push("Missing marketing channels");
    if (
      record.campaignStatus === "running" &&
      !record.approvedAt &&
      record.approvalRequired
    ) {
      errors.push("Campaign cannot run without approval");
    }

    return this.build(errors, warnings, started);
  }

  private build(
    errors: string[],
    warnings: string[],
    started: number,
  ): CampaignValidationReport {
    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";
    return {
      validationReportId: `cam-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: CAM_METADATA_VERSION,
    };
  }
}
