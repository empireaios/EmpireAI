/** T3-06 — Validation output validation and blocking decisions. */

import type { ValidationEngineConfiguration } from "./configuration.js";
import type {
  UiValidationReport,
  ValidationDecision,
  ValidationRunValidationReport,
} from "./types.js";
import { ValidationMetadataGenerator } from "./validation-metadata-generator.js";
import { appendValidationLog } from "./validation-logging.js";
import { VALIDATION_METADATA_VERSION } from "./paths.js";

export class ValidationOutputValidator {
  private readonly metadata = new ValidationMetadataGenerator();

  validate(
    reports: UiValidationReport[],
    config: ValidationEngineConfiguration,
  ): ValidationRunValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.outputValidationEnabled) {
      return this.buildReport("pass", reports, errors, warnings, started);
    }

    if (reports.length === 0) warnings.push("No validation reports produced");

    const allDefects = reports.flatMap((r) => r.detectedDefects);
    const critical = allDefects.filter((d) => d.severity === "critical");
    const high = allDefects.filter((d) => d.severity === "high");

    if (config.blockOnCriticalDefects && critical.length > 0) {
      errors.push(`${critical.length} critical defect(s) detected — UI changes blocked`);
    }
    if (config.blockOnHighDefects && high.length > 0) {
      errors.push(`${high.length} high severity defect(s) detected — UI changes blocked`);
    }

    for (const report of reports) {
      if (!report.sourcePreviewBuildId) {
        errors.push(`Missing source preview build ID for ${report.validationReportId}`);
      }
      if (report.validationStatus === "failed") {
        errors.push(`Validation failed for ${report.validationReportId}`);
      }
    }

    let decision: ValidationDecision = "pass";
    if (
      config.blockOnCriticalDefects &&
      critical.length > 0 &&
      config.blockOnHighDefects &&
      high.length > 0
    ) {
      decision = "blocked";
    } else if (config.blockOnCriticalDefects && critical.length > 0) {
      decision = "blocked";
    } else if (config.blockOnHighDefects && high.length > 0) {
      decision = "blocked";
    } else if (allDefects.length > 0) {
      decision = reports.some((r) => r.validationStatus === "validated") ? "partial" : "fail";
    } else if (warnings.length > 0) {
      decision = "partial";
    }

    appendValidationLog({
      event: "validation_output",
      level: decision === "pass" ? "info" : "warn",
      details: `Output validation ${decision.toUpperCase()} · ${allDefects.length} defects`,
    });

    const scopes = new Set(reports.map((r) => r.validationScope));
    return this.buildReport(decision, reports, errors, warnings, started, scopes.size);
  }

  private buildReport(
    decision: ValidationDecision,
    reports: UiValidationReport[],
    errors: string[],
    warnings: string[],
    started: number,
    scopesCovered = 0,
  ): ValidationRunValidationReport {
    const defectsDetected = reports.reduce((sum, r) => sum + r.detectedDefects.length, 0);
    return {
      validationReportId: this.metadata.buildValidationId(),
      validationTimestamp: new Date().toISOString(),
      decision,
      reportsValidated: reports.filter((r) => r.validationStatus !== "failed").length,
      defectsDetected,
      scopesCovered,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: VALIDATION_METADATA_VERSION,
    };
  }
}
