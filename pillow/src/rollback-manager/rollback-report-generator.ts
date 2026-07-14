/** T3-08 — Rollback report generation. */

import type {
  RollbackReport,
  RollbackStatus,
  RollbackTrigger,
  RollbackVerificationResult,
} from "./types.js";
import { RollbackMetadataGenerator } from "./rollback-metadata-generator.js";
import { appendRollbackLog } from "./rollback-logging.js";
import { ROLLBACK_METADATA_VERSION } from "./paths.js";
import type { RollbackExecutionResult } from "./rollback-execution-engine.js";

export class RollbackReportGenerator {
  private readonly metadata = new RollbackMetadataGenerator();

  buildReport(input: {
    trigger: RollbackTrigger;
    sourceRegressionReportId: string | null;
    sourceValidationReportId: string | null;
    sourcePreviewBuildId: string | null;
    sourceFrontendBuildRecordId: string | null;
    restorePointId: string;
    previousKnownGoodStateId: string;
    execution: RollbackExecutionResult;
    verification: RollbackVerificationResult;
  }): RollbackReport {
    appendRollbackLog({
      event: "rollback_report_generation",
      level: input.verification.verified ? "info" : "warn",
      details: `Rollback report for trigger ${input.trigger}`,
    });

    const rollbackStatus: RollbackStatus = input.verification.verified
      ? "verified"
      : input.execution.errors.length > 0
        ? "failed"
        : "completed";

    const confidenceScore = input.verification.verified
      ? 100
      : Math.max(0, 100 - input.verification.checksFailed * 25);

    return this.metadata.enrichReport({
      rollbackReportId: this.metadata.buildReportId(),
      timestamp: new Date().toISOString(),
      rollbackTrigger: input.trigger,
      sourceRegressionReportId: input.sourceRegressionReportId,
      sourceValidationReportId: input.sourceValidationReportId,
      sourcePreviewBuildId: input.sourcePreviewBuildId,
      sourceFrontendBuildRecordId: input.sourceFrontendBuildRecordId,
      restorePointId: input.restorePointId,
      previousKnownGoodStateId: input.previousKnownGoodStateId,
      revertedFiles: input.execution.revertedFiles,
      revertedComponents: input.execution.revertedComponents,
      revertedLayouts: input.execution.revertedLayouts,
      revertedThemes: input.execution.revertedThemes,
      rollbackStatus,
      rollbackVerificationResult: input.verification,
      errorList: input.execution.errors,
      warningList: input.execution.warnings,
      evidenceReferences: [
        input.restorePointId,
        input.previousKnownGoodStateId,
        ...input.execution.revertedFiles.slice(0, 5),
      ],
      confidenceScore,
      metadataVersion: ROLLBACK_METADATA_VERSION,
    });
  }
}
