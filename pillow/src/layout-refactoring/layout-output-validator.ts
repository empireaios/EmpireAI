/** T3-03 — Layout refactoring output validation. */

import type { LayoutRefactoringConfiguration } from "./configuration.js";
import type {
  LayoutRefactoringRecord,
  LayoutRefactoringValidationReport,
  LayoutScope,
} from "./types.js";
import { REFACTORING_METADATA_VERSION } from "./paths.js";
import { LayoutMetadataGenerator } from "./layout-metadata-generator.js";
import { appendRefactoringLog } from "./refactoring-logging.js";

export class LayoutOutputValidator {
  private readonly metadata = new LayoutMetadataGenerator();

  validate(
    records: LayoutRefactoringRecord[],
    config: LayoutRefactoringConfiguration,
  ): LayoutRefactoringValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.validationRulesEnabled) {
      return this.buildReport("pass", records, errors, warnings, started);
    }

    if (records.length === 0) {
      warnings.push("No layout refactoring records produced");
    }

    const validated = records.filter(
      (r) => r.refactoringStatus === "validated" || r.refactoringStatus === "refactored",
    );
    const blocked = records.filter((r) => r.refactoringStatus === "blocked");

    if (blocked.length > 0) {
      warnings.push(`${blocked.length} layout(s) blocked by safety checks`);
    }

    for (const record of records) {
      if (record.refactoringStatus === "skipped") continue;
      if (!record.refactoredLayoutCode && record.refactoringStatus !== "blocked") {
        errors.push(`Missing layout code for ${record.layoutRefactoringId}`);
      }
      if (record.targetFiles.length === 0) {
        errors.push(`No target files for ${record.layoutRefactoringId}`);
      }
    }

    const scopes = new Set<LayoutScope>();
    for (const r of records) {
      if (r.proposedLayoutStructure.length > 0) scopes.add("main_content");
    }

    let decision: "pass" | "fail" | "partial" = "pass";
    if (errors.length > 0) decision = validated.length > 0 ? "partial" : "fail";
    else if (warnings.length > 0 || validated.length === 0) decision = "partial";

    appendRefactoringLog({
      event: "output_validation",
      level: decision === "pass" ? "info" : "warn",
      details: `Validation ${decision.toUpperCase()} · ${records.length} records`,
    });

    return this.buildReport(decision, records, errors, warnings, started, scopes.size);
  }

  private buildReport(
    decision: "pass" | "fail" | "partial",
    records: LayoutRefactoringRecord[],
    errors: string[],
    warnings: string[],
    started: number,
    scopesCovered = 0,
  ): LayoutRefactoringValidationReport {
    return {
      validationReportId: this.metadata.buildValidationId(),
      validationTimestamp: new Date().toISOString(),
      decision,
      recordsValidated: records.filter(
        (r) => r.refactoringStatus === "validated" || r.refactoringStatus === "refactored",
      ).length,
      scopesCovered,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: REFACTORING_METADATA_VERSION,
    };
  }
}
