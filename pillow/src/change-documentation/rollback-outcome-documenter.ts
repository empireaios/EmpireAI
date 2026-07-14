/** T3-09 — Rollback outcome documentation. */

import type { ChangeDocumentationConfiguration } from "./configuration.js";
import type { ChangeDocumentationRecord, ChangeType } from "./types.js";
import type { CollectedChangeSources } from "./change-source-collector.js";
import { ChangeMetadataGenerator } from "./change-metadata-generator.js";
import { ChangeSummaryGenerator } from "./change-summary-generator.js";
import { UxRationaleGenerator } from "./ux-rationale-generator.js";
import { appendChangeDocumentationLog } from "./change-documentation-logging.js";
import { CHANGE_METADATA_VERSION } from "./paths.js";

export class RollbackOutcomeDocumenter {
  private readonly metadata = new ChangeMetadataGenerator();
  private readonly summary = new ChangeSummaryGenerator();
  private readonly rationale = new UxRationaleGenerator();

  document(
    sources: CollectedChangeSources,
    config: ChangeDocumentationConfiguration,
  ): ChangeDocumentationRecord[] {
    if (!sources.rollbackReport || sources.rollbackReport.reports.length === 0) return [];
    if (!config.documentationScopes.includes("rollback") && !config.documentationScopes.includes("full")) {
      return [];
    }

    appendChangeDocumentationLog({
      event: "rollback_summary_generation",
      level: "info",
      details: "Documenting rollback outcomes",
    });

    const records: ChangeDocumentationRecord[] = [];
    for (const rb of sources.rollbackReport.reports) {
      const changeType: ChangeType = rb.rollbackVerificationResult.verified
        ? "rollback_verification"
        : "rollback_execution";
      if (!config.supportedChangeTypes.includes(changeType)) continue;

      records.push(
        this.metadata.enrichRecord({
          changeDocumentationId: this.metadata.buildRecordId(),
          timestamp: new Date().toISOString(),
          changeType,
          sourceFrontendBuildRecordIds: rb.sourceFrontendBuildRecordId
            ? [rb.sourceFrontendBuildRecordId]
            : [],
          sourceComponentGenerationIds: [],
          sourceLayoutRefactoringIds: [],
          sourceThemeIds: [],
          sourcePreviewBuildId: rb.sourcePreviewBuildId,
          sourceValidationReportId: rb.sourceValidationReportId,
          sourceRegressionReportId: rb.sourceRegressionReportId,
          sourceRollbackReportId: sources.rollbackReport.rollbackRunReportId,
          affectedScreenIds: [],
          affectedRouteOrViewIds: [],
          affectedComponentIds: rb.revertedComponents,
          affectedLayoutRegionIds: rb.revertedLayouts,
          affectedFiles: rb.revertedFiles,
          changeSummary: this.summary.generate(changeType, sources),
          uxRationale: `${this.rationale.generate(sources, config)} — trigger: ${rb.rollbackTrigger}`,
          safetySummary: `Rollback ${rb.rollbackStatus}; verified: ${rb.rollbackVerificationResult.verified}`,
          validationSummary: rb.sourceValidationReportId ?? "not_linked",
          regressionSummary: rb.sourceRegressionReportId ?? "not_linked",
          rollbackSummary: `Trigger: ${rb.rollbackTrigger}; status: ${rb.rollbackStatus}; ${rb.revertedFiles.length} files reverted`,
          finalChangeStatus: rb.rollbackStatus === "verified" ? "accepted" : "failed",
          evidenceReferences: rb.evidenceReferences,
          metadataVersion: CHANGE_METADATA_VERSION,
        }),
      );
    }
    return records;
  }
}
