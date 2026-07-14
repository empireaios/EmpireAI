/** T3-05 — Preview output validation. */

import type { PreviewGeneratorConfiguration } from "./configuration.js";
import type {
  PreviewBuildRecord,
  PreviewGenerationValidationReport,
  PreviewScope,
} from "./types.js";
import { PREVIEW_METADATA_VERSION } from "./paths.js";
import { PreviewMetadataGenerator } from "./preview-metadata-generator.js";
import { appendPreviewLog } from "./preview-logging.js";

export class PreviewOutputValidator {
  private readonly metadata = new PreviewMetadataGenerator();

  validate(
    records: PreviewBuildRecord[],
    config: PreviewGeneratorConfiguration,
  ): PreviewGenerationValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.validationRulesEnabled) {
      return this.buildReport("pass", records, errors, warnings, started);
    }

    if (records.length === 0) warnings.push("No preview records produced");

    for (const record of records) {
      if (!record.previewUrl && !record.previewLocalReference) {
        errors.push(`Missing preview reference for ${record.previewBuildId}`);
      }
      if (record.previewFiles.length === 0) {
        errors.push(`No preview files for ${record.previewBuildId}`);
      }
      if (record.previewEnvironmentStatus === "failed") {
        warnings.push(`Environment failed for ${record.previewBuildId}`);
      }
    }

    const scopes = new Set<PreviewScope>(records.map((r) => r.previewScope));
    let decision: "pass" | "fail" | "partial" = "pass";
    const validated = records.filter(
      (r) => r.buildStatus === "validated" || r.buildStatus === "built",
    );
    if (errors.length > 0) decision = validated.length > 0 ? "partial" : "fail";
    else if (warnings.length > 0 || validated.length === 0) decision = "partial";

    appendPreviewLog({
      event: "preview_validation",
      level: decision === "pass" ? "info" : "warn",
      details: `Validation ${decision.toUpperCase()} · ${records.length} records`,
    });

    return this.buildReport(decision, records, errors, warnings, started, scopes.size);
  }

  private buildReport(
    decision: "pass" | "fail" | "partial",
    records: PreviewBuildRecord[],
    errors: string[],
    warnings: string[],
    started: number,
    scopesCovered = 0,
  ): PreviewGenerationValidationReport {
    return {
      validationReportId: this.metadata.buildValidationId(),
      validationTimestamp: new Date().toISOString(),
      decision,
      recordsValidated: records.filter(
        (r) => r.buildStatus === "validated" || r.buildStatus === "built",
      ).length,
      scopesCovered,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: PREVIEW_METADATA_VERSION,
    };
  }
}
