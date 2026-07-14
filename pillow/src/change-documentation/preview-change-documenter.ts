/** T3-09 — Preview build change documentation. */

import type { ChangeDocumentationConfiguration } from "./configuration.js";
import type { ChangeDocumentationRecord } from "./types.js";
import type { CollectedChangeSources } from "./change-source-collector.js";
import { ChangeMetadataGenerator } from "./change-metadata-generator.js";
import { ChangeSummaryGenerator } from "./change-summary-generator.js";
import { UxRationaleGenerator } from "./ux-rationale-generator.js";
import { appendChangeDocumentationLog } from "./change-documentation-logging.js";
import { CHANGE_METADATA_VERSION } from "./paths.js";

export class PreviewChangeDocumenter {
  private readonly metadata = new ChangeMetadataGenerator();
  private readonly summary = new ChangeSummaryGenerator();
  private readonly rationale = new UxRationaleGenerator();

  document(
    sources: CollectedChangeSources,
    config: ChangeDocumentationConfiguration,
  ): ChangeDocumentationRecord[] {
    if (!config.documentationScopes.includes("preview") && !config.documentationScopes.includes("full")) {
      return [];
    }

    appendChangeDocumentationLog({
      event: "preview_change_documentation",
      level: "info",
      details: "Documenting preview build outcomes",
    });

    const records: ChangeDocumentationRecord[] = [];
    for (const preview of sources.previewGeneration?.records ?? []) {
      if (!config.supportedChangeTypes.includes("preview_build_creation")) continue;

      records.push(
        this.metadata.enrichRecord({
          changeDocumentationId: this.metadata.buildRecordId(),
          timestamp: new Date().toISOString(),
          changeType: "preview_build_creation",
          sourceFrontendBuildRecordIds: preview.sourceFrontendBuildRecordIds ?? [],
          sourceComponentGenerationIds: preview.sourceComponentGenerationIds ?? [],
          sourceLayoutRefactoringIds: preview.sourceLayoutRefactoringIds ?? [],
          sourceThemeIds: preview.sourceThemeIds ?? [],
          sourcePreviewBuildId: preview.previewBuildId,
          sourceValidationReportId: sources.validationReport?.validationRunReportId ?? null,
          sourceRegressionReportId: sources.regressionReport?.regressionRunReportId ?? null,
          sourceRollbackReportId: sources.rollbackReport?.rollbackRunReportId ?? null,
          affectedScreenIds: [preview.previewTargetScreenId],
          affectedRouteOrViewIds: preview.previewTargetRouteOrViewId
            ? [preview.previewTargetRouteOrViewId]
            : [],
          affectedComponentIds: preview.sourceComponentGenerationIds ?? [],
          affectedLayoutRegionIds: [],
          affectedFiles: preview.previewFiles ?? [],
          changeSummary: this.summary.generate("preview_build_creation", sources),
          uxRationale: this.rationale.generate(sources, config),
          safetySummary: `Preview build status: ${preview.buildStatus}`,
          validationSummary: sources.validationReport?.validation.decision ?? "not_run",
          regressionSummary: sources.regressionReport?.validation.decision ?? "not_run",
          rollbackSummary: sources.rollbackReport ? sources.rollbackReport.validation.decision : null,
          finalChangeStatus:
            preview.buildStatus === "failed" || preview.buildStatus === "blocked"
              ? "failed"
              : "documented",
          evidenceReferences: [preview.previewBuildId],
          metadataVersion: CHANGE_METADATA_VERSION,
        }),
      );
    }
    return records;
  }
}
