/** R5-09 — Attribution Validator. */

import { ATT_METADATA_VERSION, ATTRIBUTION_MODELS } from "./paths.js";
import type { AttributionEngineConfiguration } from "./configuration.js";
import type {
  AttributionEngineRecord,
  AttributionRecord,
  AttributionValidationReport,
  AttributeInput,
  TrackTouchpointInput,
} from "./types.js";

export class AttributionValidator {
  validateConfiguration(config: AttributionEngineConfiguration): AttributionValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.enabled) warnings.push("Attribution Engine disabled");
    if (!config.validationRulesEnabled) {
      warnings.push("Validation rules disabled by configuration");
    }
    if (!config.neverModifyCampaignData) {
      errors.push("Campaign data modification must remain disabled");
    }
    if (!config.redactCustomerIdentifiers) {
      errors.push("Customer identifier redaction must remain enabled");
    }

    return this.build(errors, warnings, started);
  }

  validateEngineRecord(record: AttributionEngineRecord): AttributionValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.engineRecordId.startsWith("att-")) errors.push("Invalid engine record ID prefix");
    if (!record.metadataVersion) errors.push("Missing metadata version");

    const connected = Object.values(record.dependencyPresence).filter(Boolean).length;
    if (connected === 0) warnings.push("No attribution data dependencies connected");
    if (!record.dependencyPresence.campaignManager) {
      warnings.push("Campaign Manager dependency not connected");
    }

    return this.build(errors, warnings, started);
  }

  validateTouchpoint(
    input: TrackTouchpointInput,
    config: AttributionEngineConfiguration,
  ): AttributionValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.validationRulesEnabled) {
      return this.build([], ["Validation rules disabled"], started);
    }
    if (!config.touchpointRulesEnabled) {
      return this.build([], ["Touchpoint rules disabled"], started);
    }
    if (!input.customerRef?.trim()) errors.push("Customer reference is required");
    if (!input.marketingChannel) errors.push("Marketing channel is required");

    return this.build(errors, warnings, started);
  }

  validateAttribute(
    input: AttributeInput,
    config: AttributionEngineConfiguration,
  ): AttributionValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.validationRulesEnabled) {
      return this.build([], ["Validation rules disabled"], started);
    }
    if (!input.customerRef?.trim()) errors.push("Customer reference is required");
    if (!Number.isFinite(input.conversionValue) || input.conversionValue < 0) {
      errors.push("Conversion value must be a non-negative number");
    }
    if (
      input.attributionModel &&
      !(ATTRIBUTION_MODELS as readonly string[]).includes(input.attributionModel)
    ) {
      errors.push(`Invalid attribution model: ${input.attributionModel}`);
    }

    return this.build(errors, warnings, started);
  }

  validateAttributionRecord(record: AttributionRecord): AttributionValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.attributionRecordId.startsWith("att-rec-")) {
      errors.push("Invalid attribution record ID prefix");
    }
    if (!record.customerId) errors.push("Missing customer ID");
    if (!record.piiRedacted) errors.push("Attribution record must redact PII");
    if (record.attributionValue < 0) errors.push("Attribution value cannot be negative");
    if (!record.metadataVersion) errors.push("Missing metadata version");

    return this.build(errors, warnings, started);
  }

  private build(
    errors: string[],
    warnings: string[],
    started: number,
  ): AttributionValidationReport {
    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";
    return {
      validationReportId: `att-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: ATT_METADATA_VERSION,
    };
  }
}
