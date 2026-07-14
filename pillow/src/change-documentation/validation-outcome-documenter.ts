/** T3-09 — Validation outcome documentation. */

import type { ChangeDocumentationConfiguration } from "./configuration.js";
import type { ChangeDocumentationRecord, ChangeType } from "./types.js";
import type { CollectedChangeSources } from "./change-source-collector.js";
import { ChangeMetadataGenerator } from "./change-metadata-generator.js";
import { ChangeSummaryGenerator } from "./change-summary-generator.js";
import { UxRationaleGenerator } from "./ux-rationale-generator.js";
import { FileChangeExplainer } from "./file-change-explainer.js";
import { appendChangeDocumentationLog } from "./change-documentation-logging.js";
import { CHANGE_METADATA_VERSION } from "./paths.js";

export class ValidationOutcomeDocumenter {
  private readonly metadata = new ChangeMetadataGenerator();
  private readonly summary = new ChangeSummaryGenerator();
  private readonly rationale = new UxRationaleGenerator();
  private readonly fileExplainer = new FileChangeExplainer();

  document(
    sources: CollectedChangeSources,
    config: ChangeDocumentationConfiguration,
  ): ChangeDocumentationRecord[] {
    if (!sources.validationReport) return [];
    if (!config.documentationScopes.includes("validation") && !config.documentationScopes.includes("full")) {
      return [];
    }

    appendChangeDocumentationLog({
      event: "validation_summary_generation",
      level: "info",
      details: "Documenting validation outcomes",
    });

    const decision = sources.validationReport.validation.decision;
    const changeType: ChangeType =
      decision === "pass" || decision === "partial" ? "validation_pass" : "validation_failure";
    if (!config.supportedChangeTypes.includes(changeType)) return [];

    const { affectedFiles } = this.fileExplainer.explain({
      frontendBuild: sources.frontendBuild,
      componentGeneration: sources.componentGeneration,
      layoutRefactoring: sources.layoutRefactoring,
      themeGeneration: sources.themeGeneration,
      config,
    });

    const preview = sources.previewGeneration?.records[0];
    return [
      this.metadata.enrichRecord({
        changeDocumentationId: this.metadata.buildRecordId(),
        timestamp: new Date().toISOString(),
        changeType,
        sourceFrontendBuildRecordIds:
          sources.frontendBuild?.records.map((r) => r.buildRecordId) ?? [],
        sourceComponentGenerationIds:
          sources.componentGeneration?.records.map((r) => r.componentGenerationId) ?? [],
        sourceLayoutRefactoringIds:
          sources.layoutRefactoring?.records.map((r) => r.layoutRefactoringId) ?? [],
        sourceThemeIds: sources.themeGeneration?.records.map((r) => r.themeId) ?? [],
        sourcePreviewBuildId: preview?.previewBuildId ?? null,
        sourceValidationReportId: sources.validationReport.validationRunReportId,
        sourceRegressionReportId: sources.regressionReport?.regressionRunReportId ?? null,
        sourceRollbackReportId: sources.rollbackReport?.rollbackRunReportId ?? null,
        affectedScreenIds: preview ? [preview.previewTargetScreenId] : [],
        affectedRouteOrViewIds: preview?.previewTargetRouteOrViewId
          ? [preview.previewTargetRouteOrViewId]
          : [],
        affectedComponentIds:
          sources.componentGeneration?.records.map((r) => r.componentGenerationId) ?? [],
        affectedLayoutRegionIds: [],
        affectedFiles,
        changeSummary: this.summary.generate(changeType, sources),
        uxRationale: this.rationale.generate(sources, config),
        safetySummary: config.safetySummaryRulesEnabled
          ? `${sources.validationReport.validation.defectsDetected} defect(s) detected; decision: ${decision}`
          : "Safety summary disabled",
        validationSummary: `Decision: ${decision}; ${sources.validationReport.validation.defectsDetected} defects; ${sources.validationReport.reports.length} report(s)`,
        regressionSummary: sources.regressionReport?.validation.decision ?? "not_run",
        rollbackSummary: sources.rollbackReport ? sources.rollbackReport.validation.decision : null,
        finalChangeStatus: decision === "blocked" || decision === "fail" ? "rejected" : "accepted",
        evidenceReferences: [sources.validationReport.validationRunReportId],
        metadataVersion: CHANGE_METADATA_VERSION,
      }),
    ];
  }
}
