/** R5-06 — SEO Validator. */

import { SIE_METADATA_VERSION } from "./paths.js";
import type { SeoIntelligenceConfiguration } from "./configuration.js";
import type {
  AnalyzePageInput,
  ManageKeywordInput,
  OptimizeMetadataInput,
  SeoEngineRecord,
  SeoRecord,
  SeoValidationReport,
} from "./types.js";

export class SeoValidator {
  validateConfiguration(config: SeoIntelligenceConfiguration): SeoValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.enabled) warnings.push("SEO Intelligence Engine disabled");
    if (!config.validationRulesEnabled) {
      warnings.push("Validation rules disabled by configuration");
    }
    if (config.allowAutomaticContentModification) {
      errors.push("Automatic production content modification is forbidden");
    }

    return this.build(errors, warnings, started);
  }

  validateEngineRecord(record: SeoEngineRecord): SeoValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.engineRecordId.startsWith("sie-")) errors.push("Invalid engine record ID prefix");
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (!record.journeyIntelligenceConnected) {
      warnings.push("Customer Journey Intelligence dependency not connected");
    }
    if (!record.marketingDataPresent) {
      warnings.push("Marketing advertising data not present");
    }

    return this.build(errors, warnings, started);
  }

  validatePageAnalysis(
    input: AnalyzePageInput,
    config: SeoIntelligenceConfiguration,
  ): SeoValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.validationRulesEnabled) {
      return this.build([], ["Validation rules disabled"], started);
    }
    if (!input.pageReference?.trim()) errors.push("Page reference is required");

    return this.build(errors, warnings, started);
  }

  validateKeyword(
    input: ManageKeywordInput,
    config: SeoIntelligenceConfiguration,
  ): SeoValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.keywordTrackingRulesEnabled) {
      return this.build([], ["Keyword tracking rules disabled"], started);
    }
    if (!input.keyword?.trim()) errors.push("Keyword is required");

    return this.build(errors, warnings, started);
  }

  validateMetadataOptimization(
    input: OptimizeMetadataInput,
    config: SeoIntelligenceConfiguration,
  ): SeoValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.validationRulesEnabled) {
      return this.build([], ["Validation rules disabled"], started);
    }
    if (!input.pageReference?.trim()) errors.push("Page reference is required");
    if (!config.allowAutomaticContentModification) {
      warnings.push("Metadata changes require explicit validation before production apply");
    }

    return this.build(errors, warnings, started);
  }

  validateSeoRecord(record: SeoRecord): SeoValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.seoRecordId.startsWith("sie-rec-")) {
      errors.push("Invalid SEO record ID prefix");
    }
    if (!record.websiteReference) errors.push("Missing website reference");
    if (!record.pageReference) errors.push("Missing page reference");
    if (record.seoScore < 0 || record.seoScore > 100) {
      errors.push("SEO score out of range");
    }

    return this.build(errors, warnings, started);
  }

  private build(
    errors: string[],
    warnings: string[],
    started: number,
  ): SeoValidationReport {
    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";
    return {
      validationReportId: `sie-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: SIE_METADATA_VERSION,
    };
  }
}
