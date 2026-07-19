/** R5-14 — Conversion Validator. */

import { CVI_METADATA_VERSION, FUNNEL_STAGES, MARKETING_CHANNELS } from "./paths.js";
import type { ConversionIntelligenceConfiguration } from "./configuration.js";
import type {
  ConversionEngineRecord,
  ConversionRecord,
  ConversionValidationReport,
  OptimizeFunnelInput,
  TrackFunnelInput,
} from "./types.js";

export class ConversionValidator {
  validateConfiguration(
    config: ConversionIntelligenceConfiguration,
  ): ConversionValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.enabled) warnings.push("Conversion Intelligence disabled");
    if (!config.validationRulesEnabled) {
      warnings.push("Validation rules disabled by configuration");
    }
    if (!config.neverModifyProductionCampaignsWithoutValidation) {
      errors.push("Production campaign modification protection must remain enabled");
    }
    if (!config.maskSensitiveValues) {
      errors.push("Sensitive value masking must remain enabled");
    }
    if (config.bottleneckDropOffThresholdPercent <= 0) {
      errors.push("Bottleneck drop-off threshold must be positive");
    }

    return this.build(errors, warnings, started);
  }

  validateEngineRecord(record: ConversionEngineRecord): ConversionValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.engineRecordId.startsWith("cvi-")) errors.push("Invalid engine record ID prefix");
    if (!record.metadataVersion) errors.push("Missing metadata version");

    const connected = Object.values(record.dependencyPresence).filter(Boolean).length;
    if (connected === 0) warnings.push("No conversion intelligence dependencies connected");
    if (!record.dependencyPresence.attributionEngine) {
      warnings.push("Attribution Engine dependency not connected");
    }
    if (!record.dependencyPresence.campaignManager) {
      warnings.push("Campaign Manager dependency not connected");
    }

    return this.build(errors, warnings, started);
  }

  validateTrackFunnel(
    input: TrackFunnelInput,
    config: ConversionIntelligenceConfiguration,
  ): ConversionValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.validationRulesEnabled) {
      return this.build([], ["Validation rules disabled"], started);
    }
    if (!config.funnelTrackingRulesEnabled) {
      errors.push("Funnel tracking rules disabled");
    }
    if (!(MARKETING_CHANNELS as readonly string[]).includes(input.marketingChannel)) {
      errors.push(`Invalid marketing channel: ${input.marketingChannel}`);
    }
    if (
      input.funnelStage !== undefined &&
      !(FUNNEL_STAGES as readonly string[]).includes(input.funnelStage)
    ) {
      errors.push(`Invalid funnel stage: ${input.funnelStage}`);
    }
    if (
      input.conversionRate !== undefined &&
      (input.conversionRate < 0 || input.conversionRate > 100)
    ) {
      errors.push("Conversion rate must be between 0 and 100");
    }
    if (input.dropOffRate !== undefined && (input.dropOffRate < 0 || input.dropOffRate > 100)) {
      errors.push("Drop-off rate must be between 0 and 100");
    }

    return this.build(errors, warnings, started);
  }

  validateOptimize(
    input: OptimizeFunnelInput,
    config: ConversionIntelligenceConfiguration,
  ): ConversionValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.validationRulesEnabled) {
      return this.build([], ["Validation rules disabled"], started);
    }
    if (!config.recommendationRulesEnabled) {
      errors.push("Recommendation rules disabled");
    }
    if (config.neverModifyProductionCampaignsWithoutValidation && input.validated === false) {
      errors.push("Cannot modify production campaigns without validation");
    }

    return this.build(errors, warnings, started);
  }

  validateConversionRecord(record: ConversionRecord): ConversionValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.conversionRecordId.startsWith("cvi-rec-")) {
      errors.push("Invalid conversion record ID prefix");
    }
    if (record.conversionRate < 0 || record.conversionRate > 100) {
      errors.push("Conversion rate out of range");
    }
    if (record.dropOffRate < 0 || record.dropOffRate > 100) {
      errors.push("Drop-off rate out of range");
    }
    if (record.appliedToProductionCampaign !== false) {
      errors.push("Funnel changes must not apply to production campaigns without validation gate");
    }
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (record.bottleneckDetected) warnings.push("Bottleneck detected on conversion record");
    if (record.abandonmentDetected) warnings.push("Abandonment detected on conversion record");

    return this.build(errors, warnings, started);
  }

  private build(
    errors: string[],
    warnings: string[],
    started: number,
  ): ConversionValidationReport {
    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";
    return {
      validationReportId: `cvi-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: CVI_METADATA_VERSION,
    };
  }
}
