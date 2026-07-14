/** T3-04 — Theme output validation. */

import type { ThemeBuilderConfiguration } from "./configuration.js";
import type {
  ThemeGenerationValidationReport,
  ThemeRecord,
  ThemeScope,
} from "./types.js";
import { THEME_METADATA_VERSION } from "./paths.js";
import { ThemeMetadataGenerator } from "./theme-metadata-generator.js";
import { appendThemeLog } from "./theme-logging.js";

export class ThemeOutputValidator {
  private readonly metadata = new ThemeMetadataGenerator();

  validate(
    records: ThemeRecord[],
    config: ThemeBuilderConfiguration,
  ): ThemeGenerationValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.validationRulesEnabled) {
      return this.buildReport("pass", records, errors, warnings, started);
    }

    if (records.length === 0) warnings.push("No theme records produced");

    const validated = records.filter(
      (r) => r.themeStatus === "validated" || r.themeStatus === "generated",
    );
    const blocked = records.filter((r) => r.themeStatus === "blocked");
    if (blocked.length > 0) warnings.push(`${blocked.length} theme(s) blocked by safety checks`);

    for (const record of records) {
      if (!record.generatedThemeCode && record.themeStatus !== "blocked") {
        errors.push(`Missing theme code for ${record.themeId}`);
      }
      if (record.colorTokens.length === 0 && record.themeStatus !== "blocked") {
        warnings.push(`No color tokens for ${record.themeName}`);
      }
      if (record.targetFiles.length === 0) {
        errors.push(`No target files for ${record.themeId}`);
      }
    }

    const scopes = new Set<ThemeScope>(records.map((r) => r.themeScope));

    let decision: "pass" | "fail" | "partial" = "pass";
    if (errors.length > 0) decision = validated.length > 0 ? "partial" : "fail";
    else if (warnings.length > 0 || validated.length === 0) decision = "partial";

    appendThemeLog({
      event: "output_validation",
      level: decision === "pass" ? "info" : "warn",
      details: `Validation ${decision.toUpperCase()} · ${records.length} records`,
    });

    return this.buildReport(decision, records, errors, warnings, started, scopes.size);
  }

  private buildReport(
    decision: "pass" | "fail" | "partial",
    records: ThemeRecord[],
    errors: string[],
    warnings: string[],
    started: number,
    scopesCovered = 0,
  ): ThemeGenerationValidationReport {
    return {
      validationReportId: this.metadata.buildValidationId(),
      validationTimestamp: new Date().toISOString(),
      decision,
      recordsValidated: records.filter(
        (r) => r.themeStatus === "validated" || r.themeStatus === "generated",
      ).length,
      scopesCovered,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: THEME_METADATA_VERSION,
    };
  }
}
