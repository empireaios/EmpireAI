/** X2-09 — Business Health Validator. */

import type { BusinessHealthRankingConfiguration } from "./configuration.js";
import { BHR_METADATA_VERSION } from "./paths.js";
import type {
  BusinessHealthValidationReport,
  MeasureBusinessHealthInput,
  RankCompaniesInput,
} from "./types.js";

export class BusinessHealthValidator {
  private base(
    decision: BusinessHealthValidationReport["decision"],
    errors: string[],
    warnings: string[],
    durationMs: number,
  ): BusinessHealthValidationReport {
    return {
      validationReportId: `bhr-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs,
      metadataVersion: BHR_METADATA_VERSION,
    };
  }

  validateConfiguration(
    config: BusinessHealthRankingConfiguration,
  ): BusinessHealthValidationReport {
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.neverManipulateBusinessRankings) {
      errors.push("neverManipulateBusinessRankings must remain true");
    }
    if (!config.neverExposeCredentials) {
      errors.push("neverExposeCredentials must remain true");
    }
    if (!config.preserveRankingTraceability) {
      errors.push("preserveRankingTraceability must remain true");
    }
    if (config.decliningThreshold >= config.highPerformerThreshold) {
      warnings.push("decliningThreshold should be below highPerformerThreshold");
    }
    return this.base(errors.length ? "fail" : "pass", errors, warnings, 0);
  }

  validateMeasure(
    input: MeasureBusinessHealthInput,
    config: BusinessHealthRankingConfiguration,
  ): BusinessHealthValidationReport {
    const errors: string[] = [];
    if (config.validationRulesEnabled && input.validated !== true) {
      errors.push("Health measurement requires validated=true");
    }
    return this.base(errors.length ? "fail" : "pass", errors, [], 0);
  }

  validateRank(
    input: RankCompaniesInput,
    config: BusinessHealthRankingConfiguration,
  ): BusinessHealthValidationReport {
    const errors: string[] = [];
    if (config.validationRulesEnabled && input.validated !== true) {
      errors.push("Company ranking requires validated=true");
    }
    return this.base(errors.length ? "fail" : "pass", errors, [], 0);
  }
}
