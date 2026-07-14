/** T3-08 — Rollback output validation. */

import type { RollbackManagerConfiguration } from "./configuration.js";
import type { RollbackDecision, RollbackReport, RollbackRunValidationReport } from "./types.js";
import { RollbackMetadataGenerator } from "./rollback-metadata-generator.js";
import { appendRollbackLog } from "./rollback-logging.js";
import { ROLLBACK_METADATA_VERSION } from "./paths.js";

export class RollbackValidator {
  private readonly metadata = new RollbackMetadataGenerator();

  validate(
    reports: RollbackReport[],
    restorePointsCreated: number,
    config: RollbackManagerConfiguration,
  ): RollbackRunValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.outputValidationEnabled) {
      return this.buildReport("pass", reports, restorePointsCreated, errors, warnings, started);
    }

    for (const report of reports) {
      if (!report.rollbackVerificationResult.verified) {
        errors.push(`Rollback ${report.rollbackReportId} failed verification`);
      }
      if (report.rollbackStatus === "failed") {
        errors.push(`Rollback ${report.rollbackReportId} status failed`);
      }
    }

    let decision: RollbackDecision = "pass";
    if (errors.length > 0) {
      decision = reports.some((r) => r.rollbackStatus === "verified") ? "partial" : "fail";
    } else if (warnings.length > 0) {
      decision = "partial";
    }

    appendRollbackLog({
      event: "rollback_decision",
      level: decision === "pass" ? "info" : "warn",
      details: `Validation ${decision.toUpperCase()} · ${reports.length} rollbacks`,
    });

    return this.buildReport(decision, reports, restorePointsCreated, errors, warnings, started);
  }

  private buildReport(
    decision: RollbackDecision,
    reports: RollbackReport[],
    restorePointsCreated: number,
    errors: string[],
    warnings: string[],
    started: number,
  ): RollbackRunValidationReport {
    return {
      validationReportId: this.metadata.buildValidationId(),
      validationTimestamp: new Date().toISOString(),
      decision,
      rollbacksExecuted: reports.length,
      restorePointsCreated,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: ROLLBACK_METADATA_VERSION,
    };
  }
}
