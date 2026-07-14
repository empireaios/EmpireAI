/** T3-01 — Build output validation. */

import { BUILD_METADATA_VERSION } from "./paths.js";
import type {
  FrontendBuildRecord,
  FrontendBuildValidationReport,
  ValidationDecision,
} from "./types.js";
import type { FrontendBuilderConfiguration } from "./configuration.js";
import { appendBuildLog } from "./build-logging.js";

export class BuildOutputValidator {
  validate(
    records: FrontendBuildRecord[],
    config: FrontendBuilderConfiguration,
  ): FrontendBuildValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.validationRulesEnabled) {
      return this.report("pass", records, errors, warnings, started);
    }

    if (records.length === 0) {
      warnings.push("No frontend build records generated");
    }

    for (const record of records) {
      if (!record.buildRecordId) errors.push("Build record missing ID");
      if (!record.sourceRecommendationId) {
        errors.push(`Record ${record.buildRecordId} missing source recommendation`);
      }
      if (record.proposedCodeChanges.length === 0) {
        warnings.push(`Record ${record.buildRecordId} has no proposed code changes`);
      }
      if (record.implementationPlan.steps.length === 0) {
        errors.push(`Record ${record.buildRecordId} missing implementation plan`);
      }
      const failedSafety = record.safetyChecks.filter((c) => !c.passed);
      if (failedSafety.length > 0) {
        warnings.push(
          `Record ${record.buildRecordId}: ${failedSafety.length} safety check(s) failed`,
        );
      }
      if (record.buildStatus === "blocked") {
        warnings.push(`Record ${record.buildRecordId} blocked by safety checks`);
      }
    }

    let decision: ValidationDecision = "pass";
    if (errors.length > 0) decision = "fail";
    else if (warnings.length > 0) decision = "partial";

    appendBuildLog({
      event: "build_output_validation",
      level: decision === "pass" ? "info" : "warn",
      details: `Validation ${decision} · ${records.length} records`,
    });

    return this.report(decision, records, errors, warnings, started);
  }

  private report(
    decision: ValidationDecision,
    records: FrontendBuildRecord[],
    errors: string[],
    warnings: string[],
    started: number,
  ): FrontendBuildValidationReport {
    const scopes = new Set(
      records.flatMap((r) => r.proposedCodeChanges.map((c) => c.scope)),
    );
    return {
      validationReportId: `fb-validation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      recordsValidated: records.length,
      scopesCovered: scopes.size,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: BUILD_METADATA_VERSION,
    };
  }
}
