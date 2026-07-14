/** T3-09 — Regression outcome documentation. */

import type { ChangeDocumentationConfiguration } from "./configuration.js";
import type { ChangeDocumentationRecord, ChangeType } from "./types.js";
import type { CollectedChangeSources } from "./change-source-collector.js";
import { ChangeMetadataGenerator } from "./change-metadata-generator.js";
import { ChangeSummaryGenerator } from "./change-summary-generator.js";
import { UxRationaleGenerator } from "./ux-rationale-generator.js";
import { FileChangeExplainer } from "./file-change-explainer.js";
import { appendChangeDocumentationLog } from "./change-documentation-logging.js";
import { CHANGE_METADATA_VERSION } from "./paths.js";

export class RegressionOutcomeDocumenter {
  private readonly metadata = new ChangeMetadataGenerator();
  private readonly summary = new ChangeSummaryGenerator();
  private readonly rationale = new UxRationaleGenerator();
  private readonly fileExplainer = new FileChangeExplainer();

  document(
    sources: CollectedChangeSources,
    config: ChangeDocumentationConfiguration,
  ): ChangeDocumentationRecord[] {
    if (!sources.regressionReport) return [];
    if (!config.documentationScopes.includes("regression") && !config.documentationScopes.includes("full")) {
      return [];
    }

    appendChangeDocumentationLog({
      event: "regression_summary_generation",
      level: "info",
      details: "Documenting regression outcomes",
    });

    const decision = sources.regressionReport.validation.decision;
    const changeType: ChangeType =
      decision === "pass" || decision === "partial" ? "regression_pass" : "regression_failure";
    if (!config.supportedChangeTypes.includes(changeType)) return [];

    const { affectedFiles } = this.fileExplainer.explain({
      frontendBuild: sources.frontendBuild,
      componentGeneration: sources.componentGeneration,
      layoutRefactoring: sources.layoutRefactoring,
      themeGeneration: sources.themeGeneration,
      config,
    });

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
        sourcePreviewBuildId: sources.previewGeneration?.records[0]?.previewBuildId ?? null,
        sourceValidationReportId: sources.validationReport?.validationRunReportId ?? null,
        sourceRegressionReportId: sources.regressionReport.regressionRunReportId,
        sourceRollbackReportId: sources.rollbackReport?.rollbackRunReportId ?? null,
        affectedScreenIds:
          sources.regressionReport.reports[0]?.protectedScreens ?? [],
        affectedRouteOrViewIds: [],
        affectedComponentIds:
          sources.regressionReport.reports[0]?.protectedComponents ?? [],
        affectedLayoutRegionIds: [],
        affectedFiles,
        changeSummary: this.summary.generate(changeType, sources),
        uxRationale: this.rationale.generate(sources, config),
        safetySummary: config.safetySummaryRulesEnabled
          ? `${sources.regressionReport.validation.regressionsDetected} regression(s) detected`
          : "Safety summary disabled",
        validationSummary: sources.validationReport?.validation.decision ?? "not_run",
        regressionSummary: `Decision: ${decision}; ${sources.regressionReport.validation.regressionsDetected} regressions`,
        rollbackSummary: sources.rollbackReport ? sources.rollbackReport.validation.decision : null,
        finalChangeStatus: decision === "blocked" || decision === "fail" ? "rejected" : "accepted",
        evidenceReferences: [sources.regressionReport.regressionRunReportId],
        metadataVersion: CHANGE_METADATA_VERSION,
      }),
    ];
  }
}
