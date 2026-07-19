/** R5-12 — Campaign Validator. */

import { ACG_METADATA_VERSION, CAMPAIGN_OBJECTIVES } from "./paths.js";
import type { AiCampaignGeneratorConfiguration } from "./configuration.js";
import type {
  AiCampaignEngineRecord,
  AiCampaignRecord,
  AiCampaignValidationReport,
  GenerateCampaignInput,
} from "./types.js";

export class CampaignValidator {
  validateConfiguration(config: AiCampaignGeneratorConfiguration): AiCampaignValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.enabled) warnings.push("AI Campaign Generator disabled");
    if (!config.validationRulesEnabled) {
      warnings.push("Validation rules disabled by configuration");
    }
    if (!config.neverPublishWithoutValidation) {
      errors.push("Auto-publish protection must remain enabled");
    }
    if (!config.maskSensitiveValues) {
      errors.push("Sensitive value masking must remain enabled");
    }
    if (config.defaultBudgetUsd <= 0) errors.push("Default budget must be positive");

    return this.build(errors, warnings, started);
  }

  validateEngineRecord(record: AiCampaignEngineRecord): AiCampaignValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.engineRecordId.startsWith("acg-")) errors.push("Invalid engine record ID prefix");
    if (!record.metadataVersion) errors.push("Missing metadata version");

    const connected = Object.values(record.dependencyPresence).filter(Boolean).length;
    if (connected === 0) warnings.push("No marketing planning dependencies connected");
    if (!record.dependencyPresence.campaignManager) {
      warnings.push("Campaign Manager dependency not connected");
    }

    return this.build(errors, warnings, started);
  }

  validateGenerate(
    input: GenerateCampaignInput,
    config: AiCampaignGeneratorConfiguration,
  ): AiCampaignValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.validationRulesEnabled) {
      return this.build([], ["Validation rules disabled"], started);
    }
    if (!config.campaignGenerationRulesEnabled) {
      errors.push("Campaign generation rules disabled");
    }
    if (
      input.objective &&
      !(CAMPAIGN_OBJECTIVES as readonly string[]).includes(input.objective)
    ) {
      errors.push(`Invalid campaign objective: ${input.objective}`);
    }
    if (input.budgetUsd !== undefined && input.budgetUsd <= 0) {
      errors.push("Budget must be positive");
    }
    if (input.durationDays !== undefined && input.durationDays < 1) {
      errors.push("Duration must be at least 1 day");
    }

    return this.build(errors, warnings, started);
  }

  validateCampaignRecord(record: AiCampaignRecord): AiCampaignValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.aiCampaignId.startsWith("acg-camp-")) {
      errors.push("Invalid AI campaign ID prefix");
    }
    if (!record.campaignObjective) errors.push("Missing campaign objective");
    if (record.recommendedChannels.length === 0) {
      errors.push("At least one recommended channel is required");
    }
    if (record.recommendedBudget <= 0) errors.push("Recommended budget must be positive");
    if (record.publishReady !== false) {
      errors.push("AI campaigns must not be publish-ready without validation gate");
    }
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (record.recommendedKeywords.length === 0) {
      warnings.push("No keywords recommended");
    }

    return this.build(errors, warnings, started);
  }

  private build(
    errors: string[],
    warnings: string[],
    started: number,
  ): AiCampaignValidationReport {
    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";
    return {
      validationReportId: `acg-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: ACG_METADATA_VERSION,
    };
  }
}
