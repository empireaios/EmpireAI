/** T3-09 — Frontend build change documentation. */

import type { ChangeDocumentationConfiguration } from "./configuration.js";
import type { ChangeDocumentationRecord } from "./types.js";
import type { CollectedChangeSources } from "./change-source-collector.js";
import { ChangeMetadataGenerator } from "./change-metadata-generator.js";
import { ChangeSummaryGenerator } from "./change-summary-generator.js";
import { UxRationaleGenerator } from "./ux-rationale-generator.js";
import { FileChangeExplainer } from "./file-change-explainer.js";
import { appendChangeDocumentationLog } from "./change-documentation-logging.js";
import { CHANGE_METADATA_VERSION } from "./paths.js";

export class FrontendChangeDocumenter {
  private readonly metadata = new ChangeMetadataGenerator();
  private readonly summary = new ChangeSummaryGenerator();
  private readonly rationale = new UxRationaleGenerator();
  private readonly fileExplainer = new FileChangeExplainer();

  document(
    sources: CollectedChangeSources,
    config: ChangeDocumentationConfiguration,
  ): ChangeDocumentationRecord[] {
    if (!config.documentationScopes.includes("frontend") && !config.documentationScopes.includes("full")) {
      return [];
    }

    appendChangeDocumentationLog({
      event: "frontend_change_documentation",
      level: "info",
      details: "Documenting frontend build changes",
    });

    const records: ChangeDocumentationRecord[] = [];
    for (const build of sources.frontendBuild?.records ?? []) {
      if (!config.supportedChangeTypes.includes("frontend_code_generation")) continue;

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
          changeType: "frontend_code_generation",
          sourceFrontendBuildRecordIds: [build.buildRecordId],
          sourceComponentGenerationIds: [],
          sourceLayoutRefactoringIds: [],
          sourceThemeIds: [],
          sourcePreviewBuildId: null,
          sourceValidationReportId: sources.validationReport?.validationRunReportId ?? null,
          sourceRegressionReportId: sources.regressionReport?.regressionRunReportId ?? null,
          sourceRollbackReportId: sources.rollbackReport?.rollbackRunReportId ?? null,
          affectedScreenIds: build.targetScreenId ? [build.targetScreenId] : [],
          affectedRouteOrViewIds: build.targetRouteOrViewId ? [build.targetRouteOrViewId] : [],
          affectedComponentIds: [],
          affectedLayoutRegionIds: [],
          affectedFiles,
          changeSummary: this.summary.generate("frontend_code_generation", sources),
          uxRationale: this.rationale.generate(sources, config),
          safetySummary: `${build.safetyChecks.filter((c) => c.passed).length}/${build.safetyChecks.length} safety checks passed`,
          validationSummary: sources.validationReport?.validation.decision ?? "not_run",
          regressionSummary: sources.regressionReport?.validation.decision ?? "not_run",
          rollbackSummary: sources.rollbackReport ? sources.rollbackReport.validation.decision : null,
          finalChangeStatus:
            build.buildStatus === "blocked" || build.buildStatus === "failed" ? "failed" : "documented",
          evidenceReferences: [build.buildRecordId],
          metadataVersion: CHANGE_METADATA_VERSION,
        }),
      );
    }
    return records;
  }
}
