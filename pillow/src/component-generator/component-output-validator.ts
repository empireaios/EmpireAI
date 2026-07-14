/** T3-02 — Component output validation. */

import { GENERATION_METADATA_VERSION } from "./paths.js";
import type {
  ComponentGenerationRecord,
  ComponentGenerationValidationReport,
  ValidationDecision,
} from "./types.js";
import type { ComponentGeneratorConfiguration } from "./configuration.js";
import { appendGenerationLog } from "./generation-logging.js";

export class ComponentOutputValidator {
  validate(
    records: ComponentGenerationRecord[],
    config: ComponentGeneratorConfiguration,
  ): ComponentGenerationValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.validationRulesEnabled) {
      return this.report("pass", records, errors, warnings, started);
    }

    if (records.length === 0) {
      warnings.push("No component generation records produced");
    }

    for (const record of records) {
      if (!record.componentGenerationId) errors.push("Record missing generation ID");
      if (!record.sourceRecommendationId) {
        errors.push(`Record ${record.componentGenerationId} missing source recommendation`);
      }
      if (!record.generatedComponentCode) {
        errors.push(`Record ${record.componentGenerationId} missing component code`);
      }
      if (!record.generatedPropsOrInterface) {
        warnings.push(`Record ${record.componentGenerationId} missing props interface`);
      }
      if (record.generatedVariants.length === 0 && config.variantRulesEnabled) {
        warnings.push(`Record ${record.componentGenerationId} has no variants`);
      }
      const failedSafety = record.safetyChecks.filter((c) => !c.passed);
      if (failedSafety.length > 0) {
        warnings.push(
          `Record ${record.componentGenerationId}: ${failedSafety.length} safety check(s) failed`,
        );
      }
      if (record.generationStatus === "blocked") {
        warnings.push(`Record ${record.componentGenerationId} blocked by safety checks`);
      }
    }

    let decision: ValidationDecision = "pass";
    if (errors.length > 0) decision = "fail";
    else if (warnings.length > 0) decision = "partial";

    appendGenerationLog({
      event: "output_validation",
      level: decision === "pass" ? "info" : "warn",
      details: `Validation ${decision} · ${records.length} records`,
    });

    return this.report(decision, records, errors, warnings, started);
  }

  private report(
    decision: ValidationDecision,
    records: ComponentGenerationRecord[],
    errors: string[],
    warnings: string[],
    started: number,
  ): ComponentGenerationValidationReport {
    const categories = new Set(records.map((r) => r.componentCategory));
    return {
      validationReportId: `cg-validation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      recordsValidated: records.length,
      categoriesCovered: categories.size,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: GENERATION_METADATA_VERSION,
    };
  }
}
