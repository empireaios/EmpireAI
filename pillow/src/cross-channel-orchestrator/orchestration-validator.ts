/** R5-18 — Orchestration Validator. */

import { CCO_METADATA_VERSION, MARKETING_CHANNELS } from "./paths.js";
import type { CrossChannelOrchestratorConfiguration } from "./configuration.js";
import type {
  CoordinateCampaignsInput,
  OrchestrationEngineRecord,
  OrchestrationRecord,
  OrchestrationValidationReport,
} from "./types.js";

export class OrchestrationValidator {
  validateConfiguration(
    config: CrossChannelOrchestratorConfiguration,
  ): OrchestrationValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.enabled) warnings.push("Cross-Channel Orchestrator disabled");
    if (!config.validationRulesEnabled) {
      warnings.push("Validation rules disabled by configuration");
    }
    if (!config.neverLaunchCoordinatedCampaignsWithoutValidation) {
      errors.push("Coordinated campaign launch protection must remain enabled");
    }
    if (!config.maskSensitiveValues) {
      errors.push("Sensitive value masking must remain enabled");
    }
    if (config.maxChannelsPerOrchestration <= 0) {
      errors.push("Max channels per orchestration must be positive");
    }

    return this.build(errors, warnings, started);
  }

  validateEngineRecord(record: OrchestrationEngineRecord): OrchestrationValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.engineRecordId.startsWith("cco-")) errors.push("Invalid engine record ID prefix");
    if (!record.metadataVersion) errors.push("Missing metadata version");

    const connected = Object.values(record.dependencyPresence).filter(Boolean).length;
    if (connected === 0) warnings.push("No cross-channel orchestration dependencies connected");
    if (!record.dependencyPresence.campaignManager) {
      warnings.push("Campaign Manager dependency not connected");
    }
    if (!record.dependencyPresence.marketingExperimentEngine) {
      warnings.push("Marketing Experiment Engine dependency not connected");
    }

    return this.build(errors, warnings, started);
  }

  validateCoordinate(
    input: CoordinateCampaignsInput,
    config: CrossChannelOrchestratorConfiguration,
  ): OrchestrationValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.validationRulesEnabled) {
      return this.build([], ["Validation rules disabled"], started);
    }
    if (!config.campaignCoordinationRulesEnabled) {
      errors.push("Campaign coordination rules disabled");
    }
    if (input.marketingChannels) {
      for (const channel of input.marketingChannels) {
        if (!(MARKETING_CHANNELS as readonly string[]).includes(channel)) {
          errors.push(`Invalid marketing channel: ${channel}`);
        }
      }
      if (input.marketingChannels.length > config.maxChannelsPerOrchestration) {
        errors.push("Too many channels for a single orchestration");
      }
    }
    if (config.neverLaunchCoordinatedCampaignsWithoutValidation && input.validated === false) {
      errors.push("Cannot launch coordinated campaigns without validation");
    }

    return this.build(errors, warnings, started);
  }

  validateOrchestrationRecord(record: OrchestrationRecord): OrchestrationValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.orchestrationId.startsWith("cco-orc-")) {
      errors.push("Invalid orchestration ID prefix");
    }
    if (record.marketingChannels.length === 0) {
      errors.push("At least one marketing channel is required");
    }
    if (record.launchedToProduction !== false) {
      errors.push("Coordinated campaigns must not launch to production without validation gate");
    }
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (record.conflictStatus === "detected") {
      warnings.push("Channel conflict detected");
    }

    return this.build(errors, warnings, started);
  }

  private build(
    errors: string[],
    warnings: string[],
    started: number,
  ): OrchestrationValidationReport {
    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";
    return {
      validationReportId: `cco-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: CCO_METADATA_VERSION,
    };
  }
}
