/** R5-16 — Trend Validator. */

import { TREND_CATEGORIES, TREND_SOURCES, VTI_METADATA_VERSION } from "./paths.js";
import type { ViralTrendIntelligenceConfiguration } from "./configuration.js";
import type {
  DiscoverTrendsInput,
  TrendEngineRecord,
  TrendRecord,
  TrendValidationReport,
} from "./types.js";

export class TrendValidator {
  validateConfiguration(
    config: ViralTrendIntelligenceConfiguration,
  ): TrendValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.enabled) warnings.push("Viral Trend Intelligence disabled");
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
    if (config.emergingScoreThreshold <= 0) {
      errors.push("Emerging score threshold must be positive");
    }

    return this.build(errors, warnings, started);
  }

  validateEngineRecord(record: TrendEngineRecord): TrendValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.engineRecordId.startsWith("vti-")) errors.push("Invalid engine record ID prefix");
    if (!record.metadataVersion) errors.push("Missing metadata version");

    const connected = Object.values(record.dependencyPresence).filter(Boolean).length;
    if (connected === 0) warnings.push("No viral trend intelligence dependencies connected");
    if (!record.dependencyPresence.seoIntelligence) {
      warnings.push("SEO Intelligence dependency not connected");
    }
    if (!record.dependencyPresence.competitorMarketingMonitor) {
      warnings.push("Competitor Marketing Monitor dependency not connected");
    }

    return this.build(errors, warnings, started);
  }

  validateDiscover(
    input: DiscoverTrendsInput,
    config: ViralTrendIntelligenceConfiguration,
  ): TrendValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.validationRulesEnabled) {
      return this.build([], ["Validation rules disabled"], started);
    }
    if (!config.trendMonitoringRulesEnabled) {
      errors.push("Trend monitoring rules disabled");
    }
    if (
      input.trendCategory !== undefined &&
      !(TREND_CATEGORIES as readonly string[]).includes(input.trendCategory)
    ) {
      errors.push(`Invalid trend category: ${input.trendCategory}`);
    }
    if (
      input.trendSource !== undefined &&
      !(TREND_SOURCES as readonly string[]).includes(input.trendSource)
    ) {
      errors.push(`Invalid trend source: ${input.trendSource}`);
    }
    if (input.seedKeyword !== undefined && !input.seedKeyword.trim()) {
      errors.push("Seed keyword cannot be empty");
    }

    return this.build(errors, warnings, started);
  }

  validateTrendRecord(record: TrendRecord): TrendValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.trendRecordId.startsWith("vti-rec-")) {
      errors.push("Invalid trend record ID prefix");
    }
    if (record.trendScore < 0 || record.trendScore > 100) {
      errors.push("Trend score out of range");
    }
    if (record.authorizedPublicSignalsOnly !== true) {
      errors.push("Only authorized public signals may be stored");
    }
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (record.accelerationDetected) warnings.push("Trend acceleration detected");
    if (record.declineDetected) warnings.push("Trend decline detected");

    return this.build(errors, warnings, started);
  }

  private build(
    errors: string[],
    warnings: string[],
    started: number,
  ): TrendValidationReport {
    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";
    return {
      validationReportId: `vti-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: VTI_METADATA_VERSION,
    };
  }
}
