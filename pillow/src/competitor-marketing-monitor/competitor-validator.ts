/** R5-15 — Competitor Validator. */

import { CMM_METADATA_VERSION, MARKETING_CHANNELS } from "./paths.js";
import type { CompetitorMarketingMonitorConfiguration } from "./configuration.js";
import type {
  CompetitorEngineRecord,
  CompetitorRecord,
  CompetitorValidationReport,
  DiscoverCompetitorsInput,
} from "./types.js";

export class CompetitorValidator {
  validateConfiguration(
    config: CompetitorMarketingMonitorConfiguration,
  ): CompetitorValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.enabled) warnings.push("Competitor Marketing Monitor disabled");
    if (!config.validationRulesEnabled) {
      warnings.push("Validation rules disabled by configuration");
    }
    if (!config.neverCollectRestrictedOrUnauthorizedInfo) {
      errors.push("Restricted information collection protection must remain enabled");
    }
    if (!config.authorizedPublicSignalsOnly) {
      errors.push("Authorized public signals only must remain enabled");
    }
    if (!config.maskSensitiveValues) {
      errors.push("Sensitive value masking must remain enabled");
    }
    if (config.monitoringFrequencyMinutes <= 0) {
      errors.push("Monitoring frequency must be positive");
    }

    return this.build(errors, warnings, started);
  }

  validateEngineRecord(record: CompetitorEngineRecord): CompetitorValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.engineRecordId.startsWith("cmm-")) errors.push("Invalid engine record ID prefix");
    if (!record.metadataVersion) errors.push("Missing metadata version");

    const connected = Object.values(record.dependencyPresence).filter(Boolean).length;
    if (connected === 0) warnings.push("No competitor monitoring dependencies connected");
    if (!record.dependencyPresence.seoIntelligence) {
      warnings.push("SEO Intelligence dependency not connected");
    }
    if (!record.dependencyPresence.campaignManager) {
      warnings.push("Campaign Manager dependency not connected");
    }

    return this.build(errors, warnings, started);
  }

  validateDiscover(
    input: DiscoverCompetitorsInput,
    config: CompetitorMarketingMonitorConfiguration,
  ): CompetitorValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.validationRulesEnabled) {
      return this.build([], ["Validation rules disabled"], started);
    }
    if (!config.competitorDiscoveryRulesEnabled) {
      errors.push("Competitor discovery rules disabled");
    }
    if (
      input.marketingChannel !== undefined &&
      !(MARKETING_CHANNELS as readonly string[]).includes(input.marketingChannel)
    ) {
      errors.push(`Invalid marketing channel: ${input.marketingChannel}`);
    }
    if (input.seedIdentifier !== undefined && !input.seedIdentifier.trim()) {
      errors.push("Seed identifier cannot be empty");
    }

    return this.build(errors, warnings, started);
  }

  validateCompetitorRecord(record: CompetitorRecord): CompetitorValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.competitorRecordId.startsWith("cmm-rec-")) {
      errors.push("Invalid competitor record ID prefix");
    }
    if (!record.competitorIdentifier.trim()) {
      errors.push("Competitor identifier is required");
    }
    if (record.competitiveScore < 0 || record.competitiveScore > 100) {
      errors.push("Competitive score out of range");
    }
    if (record.authorizedPublicSignalsOnly !== true) {
      errors.push("Only authorized public signals may be stored");
    }
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (record.strategyChangeDetected) warnings.push("Strategy change detected");
    if (record.emergingCompetitor) warnings.push("Emerging competitor flagged");

    return this.build(errors, warnings, started);
  }

  private build(
    errors: string[],
    warnings: string[],
    started: number,
  ): CompetitorValidationReport {
    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";
    return {
      validationReportId: `cmm-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: CMM_METADATA_VERSION,
    };
  }
}
