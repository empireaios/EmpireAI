/** T3-09 — Theme change documentation. */

import type { ChangeDocumentationConfiguration } from "./configuration.js";
import type { ChangeDocumentationRecord } from "./types.js";
import type { CollectedChangeSources } from "./change-source-collector.js";
import { ChangeMetadataGenerator } from "./change-metadata-generator.js";
import { ChangeSummaryGenerator } from "./change-summary-generator.js";
import { UxRationaleGenerator } from "./ux-rationale-generator.js";
import { FileChangeExplainer } from "./file-change-explainer.js";
import { appendChangeDocumentationLog } from "./change-documentation-logging.js";
import { CHANGE_METADATA_VERSION } from "./paths.js";

export class ThemeChangeDocumenter {
  private readonly metadata = new ChangeMetadataGenerator();
  private readonly summary = new ChangeSummaryGenerator();
  private readonly rationale = new UxRationaleGenerator();
  private readonly fileExplainer = new FileChangeExplainer();

  document(
    sources: CollectedChangeSources,
    config: ChangeDocumentationConfiguration,
  ): ChangeDocumentationRecord[] {
    if (!config.documentationScopes.includes("theme") && !config.documentationScopes.includes("full")) {
      return [];
    }

    appendChangeDocumentationLog({
      event: "theme_change_documentation",
      level: "info",
      details: "Documenting theme changes",
    });

    const records: ChangeDocumentationRecord[] = [];
    for (const theme of sources.themeGeneration?.records ?? []) {
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
          changeType: "theme_generation",
          sourceFrontendBuildRecordIds: [],
          sourceComponentGenerationIds: theme.sourceComponentGenerationIds ?? [],
          sourceLayoutRefactoringIds: theme.sourceLayoutRefactoringId
            ? [theme.sourceLayoutRefactoringId]
            : [],
          sourceThemeIds: [theme.themeId],
          sourcePreviewBuildId: null,
          sourceValidationReportId: sources.validationReport?.validationRunReportId ?? null,
          sourceRegressionReportId: sources.regressionReport?.regressionRunReportId ?? null,
          sourceRollbackReportId: sources.rollbackReport?.rollbackRunReportId ?? null,
          affectedScreenIds: [],
          affectedRouteOrViewIds: [],
          affectedComponentIds: theme.sourceComponentGenerationIds ?? [],
          affectedLayoutRegionIds: [],
          affectedFiles,
          changeSummary: this.summary.generate("theme_generation", sources),
          uxRationale: this.rationale.generate(sources, config),
          safetySummary: `${theme.safetyChecks.filter((c) => c.passed).length}/${theme.safetyChecks.length} safety checks passed`,
          validationSummary: sources.validationReport?.validation.decision ?? "not_run",
          regressionSummary: sources.regressionReport?.validation.decision ?? "not_run",
          rollbackSummary: sources.rollbackReport ? sources.rollbackReport.validation.decision : null,
          finalChangeStatus:
            theme.themeStatus === "blocked" || theme.themeStatus === "failed" ? "rejected" : "accepted",
          evidenceReferences: [theme.themeId],
          metadataVersion: CHANGE_METADATA_VERSION,
        }),
      );
    }
    return records;
  }
}
