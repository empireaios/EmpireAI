/** T3-09 — Component change documentation. */

import type { ComponentGenerationReport } from "../component-generator/types.js";
import type { ChangeDocumentationConfiguration } from "./configuration.js";
import type { ChangeDocumentationRecord, ChangeType } from "./types.js";
import type { CollectedChangeSources } from "./change-source-collector.js";
import { ChangeMetadataGenerator } from "./change-metadata-generator.js";
import { ChangeSummaryGenerator } from "./change-summary-generator.js";
import { UxRationaleGenerator } from "./ux-rationale-generator.js";
import { FileChangeExplainer } from "./file-change-explainer.js";
import { appendChangeDocumentationLog } from "./change-documentation-logging.js";
import { CHANGE_METADATA_VERSION } from "./paths.js";

export class ComponentChangeDocumenter {
  private readonly metadata = new ChangeMetadataGenerator();
  private readonly summary = new ChangeSummaryGenerator();
  private readonly rationale = new UxRationaleGenerator();
  private readonly fileExplainer = new FileChangeExplainer();

  document(
    sources: CollectedChangeSources,
    config: ChangeDocumentationConfiguration,
  ): ChangeDocumentationRecord[] {
    if (!config.documentationScopes.includes("component") && !config.documentationScopes.includes("full")) {
      return [];
    }

    appendChangeDocumentationLog({
      event: "component_change_documentation",
      level: "info",
      details: "Documenting component changes",
    });

    const records: ChangeDocumentationRecord[] = [];
    for (const comp of sources.componentGeneration?.records ?? []) {
      const changeType: ChangeType = ["loading_state", "empty_state", "error_state"].includes(
        comp.componentCategory,
      )
        ? "component_variant_generation"
        : "component_generation";
      if (!config.supportedChangeTypes.includes(changeType)) continue;

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
          changeType,
          sourceFrontendBuildRecordIds: comp.sourceFrontendBuildRecordId
            ? [comp.sourceFrontendBuildRecordId]
            : [],
          sourceComponentGenerationIds: [comp.componentGenerationId],
          sourceLayoutRefactoringIds: [],
          sourceThemeIds: [],
          sourcePreviewBuildId: null,
          sourceValidationReportId: sources.validationReport?.validationRunReportId ?? null,
          sourceRegressionReportId: sources.regressionReport?.regressionRunReportId ?? null,
          sourceRollbackReportId: sources.rollbackReport?.rollbackRunReportId ?? null,
          affectedScreenIds: [],
          affectedRouteOrViewIds: [],
          affectedComponentIds: [comp.componentGenerationId],
          affectedLayoutRegionIds: [],
          affectedFiles,
          changeSummary: this.summary.generate(changeType, sources),
          uxRationale: `${this.rationale.generate(sources, config)} — ${comp.componentName}`,
          safetySummary: `${comp.safetyChecks.filter((c) => c.passed).length}/${comp.safetyChecks.length} safety checks passed`,
          validationSummary: sources.validationReport?.validation.decision ?? "not_run",
          regressionSummary: sources.regressionReport?.validation.decision ?? "not_run",
          rollbackSummary: sources.rollbackReport ? sources.rollbackReport.validation.decision : null,
          finalChangeStatus:
            comp.generationStatus === "blocked" || comp.generationStatus === "failed"
              ? "rejected"
              : "accepted",
          evidenceReferences: [comp.componentGenerationId],
          metadataVersion: CHANGE_METADATA_VERSION,
        }),
      );
    }
    return records;
  }
}
