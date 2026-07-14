/** T4-05 — Comparison output validation. */

import type { SideBySideComparisonConfiguration } from "./configuration.js";
import type {
  ComparisonDecision,
  ComparisonRunValidationReport,
  SideBySideComparisonRecord,
} from "./types.js";
import { ComparisonMetadataGenerator } from "./comparison-metadata-generator.js";
import { appendComparisonLog } from "./comparison-logging.js";
import { COMPARISON_METADATA_VERSION } from "./paths.js";

export class ComparisonValidator {
  private readonly metadata = new ComparisonMetadataGenerator();

  validate(
    comparison: SideBySideComparisonRecord | null,
    config: SideBySideComparisonConfiguration,
    extras?: { appliedChanges?: boolean; approvedChanges?: boolean },
  ): ComparisonRunValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.outputValidationEnabled || !config.validationRulesEnabled) {
      return this.buildReport("pass", comparison, errors, warnings, started);
    }

    if (!comparison) {
      errors.push("No comparison record produced");
      return this.buildReport("fail", comparison, errors, warnings, started);
    }

    if (comparison.comparedOptions.length < 2) {
      warnings.push("Fewer than two options compared side by side");
    }
    if (comparison.comparedOptions.length > config.maximumComparedOptions) {
      errors.push(`Exceeded maximum compared options ${config.maximumComparedOptions}`);
    }
    if (!comparison.differenceSummary) warnings.push("Missing difference summary");
    if (extras?.appliedChanges) errors.push("Comparisons must not apply UX changes automatically");
    if (extras?.approvedChanges) errors.push("Comparisons must not approve changes automatically");

    let decision: ComparisonDecision = "pass";
    if (errors.length > 0) decision = "fail";
    else if (warnings.length > 0) decision = "partial";

    appendComparisonLog({
      event: "validation_results",
      level: decision === "pass" ? "info" : "warn",
      details: `Validation ${decision.toUpperCase()}`,
    });

    return this.buildReport(decision, comparison, errors, warnings, started);
  }

  private buildReport(
    decision: ComparisonDecision,
    comparison: SideBySideComparisonRecord | null,
    errors: string[],
    warnings: string[],
    started: number,
  ): ComparisonRunValidationReport {
    return {
      validationReportId: this.metadata.buildValidationId(),
      validationTimestamp: new Date().toISOString(),
      decision,
      comparisonsProcessed: comparison ? 1 : 0,
      optionsCompared: comparison?.comparedOptions.length ?? 0,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: COMPARISON_METADATA_VERSION,
    };
  }
}
