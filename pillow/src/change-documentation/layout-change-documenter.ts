/** T3-09 — Layout change documentation. */

import type { ChangeDocumentationConfiguration } from "./configuration.js";
import type { ChangeDocumentationRecord } from "./types.js";
import type { CollectedChangeSources } from "./change-source-collector.js";
import { ChangeMetadataGenerator } from "./change-metadata-generator.js";
import { ChangeSummaryGenerator } from "./change-summary-generator.js";
import { UxRationaleGenerator } from "./ux-rationale-generator.js";
import { FileChangeExplainer } from "./file-change-explainer.js";
import { appendChangeDocumentationLog } from "./change-documentation-logging.js";
import { CHANGE_METADATA_VERSION } from "./paths.js";

export class LayoutChangeDocumenter {
  private readonly metadata = new ChangeMetadataGenerator();
  private readonly summary = new ChangeSummaryGenerator();
  private readonly rationale = new UxRationaleGenerator();
  private readonly fileExplainer = new FileChangeExplainer();

  document(
    sources: CollectedChangeSources,
    config: ChangeDocumentationConfiguration,
  ): ChangeDocumentationRecord[] {
    if (!config.documentationScopes.includes("layout") && !config.documentationScopes.includes("full")) {
      return [];
    }

    appendChangeDocumentationLog({
      event: "layout_change_documentation",
      level: "info",
      details: "Documenting layout changes",
    });

    const records: ChangeDocumentationRecord[] = [];
    for (const layout of sources.layoutRefactoring?.records ?? []) {
      const { affectedFiles } = this.fileExplainer.explain({
        frontendBuild: sources.frontendBuild,
        componentGeneration: sources.componentGeneration,
        layoutRefactoring: sources.layoutRefactoring,
        themeGeneration: sources.themeGeneration,
        config,
      });

      records.push(
        this.metadata.enrichRecord({
          changeDocumentationId: this.metadata.buildRecordId(),
          timestamp: new Date().toISOString(),
          changeType: "layout_refactoring",
          sourceFrontendBuildRecordIds: layout.sourceFrontendBuildRecordId
            ? [layout.sourceFrontendBuildRecordId]
            : [],
          sourceComponentGenerationIds: layout.sourceComponentGenerationIds,
          sourceLayoutRefactoringIds: [layout.layoutRefactoringId],
          sourceThemeIds: [],
          sourcePreviewBuildId: null,
          sourceValidationReportId: sources.validationReport?.validationRunReportId ?? null,
          sourceRegressionReportId: sources.regressionReport?.regressionRunReportId ?? null,
          sourceRollbackReportId: sources.rollbackReport?.rollbackRunReportId ?? null,
          affectedScreenIds: [layout.targetScreenId],
          affectedRouteOrViewIds: layout.targetRouteOrViewId ? [layout.targetRouteOrViewId] : [],
          affectedComponentIds: layout.sourceComponentGenerationIds,
          affectedLayoutRegionIds: layout.componentPlacementMap.map((p) => p.region),
          affectedFiles,
          changeSummary: this.summary.generate("layout_refactoring", sources),
          uxRationale: this.rationale.generate(sources, config),
          safetySummary: `${layout.safetyChecks.filter((c) => c.passed).length}/${layout.safetyChecks.length} safety checks passed`,
          validationSummary: sources.validationReport?.validation.decision ?? "not_run",
          regressionSummary: sources.regressionReport?.validation.decision ?? "not_run",
          rollbackSummary: sources.rollbackReport ? sources.rollbackReport.validation.decision : null,
          finalChangeStatus:
            layout.refactoringStatus === "blocked" || layout.refactoringStatus === "failed"
              ? "rejected"
              : "accepted",
          evidenceReferences: [layout.layoutRefactoringId],
          metadataVersion: CHANGE_METADATA_VERSION,
        }),
      );
    }
    return records;
  }
}
