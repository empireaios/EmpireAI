/** T3-09 — Change documentation output validation. */

import type { ChangeDocumentationConfiguration } from "./configuration.js";
import type {
  ChangeDocumentationRecord,
  ChangeDocumentationRunValidationReport,
  DocumentationDecision,
} from "./types.js";
import { ChangeMetadataGenerator } from "./change-metadata-generator.js";
import { appendChangeDocumentationLog } from "./change-documentation-logging.js";
import { CHANGE_METADATA_VERSION } from "./paths.js";

export class ChangeDocumentationValidator {
  private readonly metadata = new ChangeMetadataGenerator();

  validate(
    records: ChangeDocumentationRecord[],
    config: ChangeDocumentationConfiguration,
  ): ChangeDocumentationRunValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.outputValidationEnabled) {
      return this.buildReport("pass", records, errors, warnings, started);
    }

    for (const record of records) {
      for (const field of config.requiredMetadataFields) {
        const value = record[field as keyof ChangeDocumentationRecord];
        if (value === undefined || value === null || value === "") {
          errors.push(`Record ${record.changeDocumentationId} missing required field: ${field}`);
        }
        if (Array.isArray(value) && value.length === 0 && field === "affectedFiles") {
          warnings.push(`Record ${record.changeDocumentationId} has no affected files`);
        }
      }
      if (config.evidenceReferenceRulesEnabled && record.evidenceReferences.length === 0) {
        warnings.push(`Record ${record.changeDocumentationId} has no evidence references`);
      }
    }

    if (records.length === 0) {
      warnings.push("No change records documented in this run");
    }

    let decision: DocumentationDecision = "pass";
    if (errors.length > 0) {
      decision = records.length > 0 ? "partial" : "fail";
    } else if (warnings.length > 0) {
      decision = "partial";
    }

    appendChangeDocumentationLog({
      event: "documentation_validation",
      level: decision === "pass" ? "info" : "warn",
      details: `Validation ${decision.toUpperCase()} · ${records.length} records`,
    });

    return this.buildReport(decision, records, errors, warnings, started);
  }

  private buildReport(
    decision: DocumentationDecision,
    records: ChangeDocumentationRecord[],
    errors: string[],
    warnings: string[],
    started: number,
  ): ChangeDocumentationRunValidationReport {
    const scopes = new Set(records.map((r) => r.changeType));
    return {
      validationReportId: this.metadata.buildValidationId(),
      validationTimestamp: new Date().toISOString(),
      decision,
      recordsDocumented: records.length,
      scopesCovered: scopes.size,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: CHANGE_METADATA_VERSION,
    };
  }
}
