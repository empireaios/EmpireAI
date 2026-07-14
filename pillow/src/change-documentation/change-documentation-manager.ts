/** T3-09 — Change Documentation Manager — core documentation pipeline. */

import type { FrontendBuildReport } from "../frontend-builder/types.js";
import type { ComponentGenerationReport } from "../component-generator/types.js";
import type { LayoutRefactoringReport } from "../layout-refactoring/types.js";
import type { ThemeGenerationReport } from "../theme-builder/types.js";
import type { PreviewGenerationReport } from "../preview-generator/types.js";
import type { ValidationRunReport } from "../validation-engine/types.js";
import type { RegressionRunReport } from "../regression-protection/types.js";
import type { RollbackRunReport } from "../rollback-manager/types.js";
import type { ChangeDocumentationConfiguration } from "./configuration.js";
import type { ChangeDocumentationRecord, ChangeDocumentationRunReport, ChangeType } from "./types.js";
import { ChangeSourceCollector } from "./change-source-collector.js";
import { FrontendChangeDocumenter } from "./frontend-change-documenter.js";
import { PreviewChangeDocumenter } from "./preview-change-documenter.js";
import { ComponentChangeDocumenter } from "./component-change-documenter.js";
import { LayoutChangeDocumenter } from "./layout-change-documenter.js";
import { ThemeChangeDocumenter } from "./theme-change-documenter.js";
import { ValidationOutcomeDocumenter } from "./validation-outcome-documenter.js";
import { RegressionOutcomeDocumenter } from "./regression-outcome-documenter.js";
import { RollbackOutcomeDocumenter } from "./rollback-outcome-documenter.js";
import { ChangeReportGenerator } from "./change-report-generator.js";
import { ChangeDocumentationValidator } from "./change-documentation-validator.js";
import { ChangeMetadataGenerator } from "./change-metadata-generator.js";
import { ChangeSummaryGenerator } from "./change-summary-generator.js";
import { UxRationaleGenerator } from "./ux-rationale-generator.js";
import { FileChangeExplainer } from "./file-change-explainer.js";
import { appendChangeDocumentationLog } from "./change-documentation-logging.js";
import { CHANGE_METADATA_VERSION } from "./paths.js";

export class ChangeDocumentationManager {
  private readonly sourceCollector = new ChangeSourceCollector();
  private readonly frontendDocumenter = new FrontendChangeDocumenter();
  private readonly previewDocumenter = new PreviewChangeDocumenter();
  private readonly componentDocumenter = new ComponentChangeDocumenter();
  private readonly layoutDocumenter = new LayoutChangeDocumenter();
  private readonly themeDocumenter = new ThemeChangeDocumenter();
  private readonly validationDocumenter = new ValidationOutcomeDocumenter();
  private readonly regressionDocumenter = new RegressionOutcomeDocumenter();
  private readonly rollbackDocumenter = new RollbackOutcomeDocumenter();
  private readonly reportGenerator = new ChangeReportGenerator();
  private readonly validator = new ChangeDocumentationValidator();
  private readonly metadata = new ChangeMetadataGenerator();
  private readonly summary = new ChangeSummaryGenerator();
  private readonly rationale = new UxRationaleGenerator();
  private readonly fileExplainer = new FileChangeExplainer();

  documentChanges(input: {
    config: ChangeDocumentationConfiguration;
    repositoryRoot?: string;
    frontendBuild: FrontendBuildReport | null;
    componentGeneration: ComponentGenerationReport | null;
    layoutRefactoring: LayoutRefactoringReport | null;
    themeGeneration: ThemeGenerationReport | null;
    previewGeneration: PreviewGenerationReport | null;
    validationReport: ValidationRunReport | null;
    regressionReport: RegressionRunReport | null;
    rollbackReport: RollbackRunReport | null;
  }): ChangeDocumentationRunReport {
    const started = Date.now();

    appendChangeDocumentationLog({
      event: "change_documentation_start",
      level: "info",
      details: "Starting change documentation run",
    });

    const sources = this.sourceCollector.collect({
      frontendBuild: input.frontendBuild,
      componentGeneration: input.componentGeneration,
      layoutRefactoring: input.layoutRefactoring,
      themeGeneration: input.themeGeneration,
      previewGeneration: input.previewGeneration,
      validationReport: input.validationReport,
      regressionReport: input.regressionReport,
      rollbackReport: input.rollbackReport,
    });

    const records: ChangeDocumentationRecord[] = [
      ...this.frontendDocumenter.document(sources, input.config),
      ...this.previewDocumenter.document(sources, input.config),
      ...this.componentDocumenter.document(sources, input.config),
      ...this.layoutDocumenter.document(sources, input.config),
      ...this.themeDocumenter.document(sources, input.config),
      ...this.validationDocumenter.document(sources, input.config),
      ...this.regressionDocumenter.document(sources, input.config),
      ...this.rollbackDocumenter.document(sources, input.config),
      ...this.documentFinalStatus(sources, input.config),
    ].slice(0, input.config.maxRecordsPerRun);

    const validation = this.validator.validate(records, input.config);
    const report = this.reportGenerator.buildReport(records, validation, Date.now() - started);
    this.reportGenerator.persist(report, input.config, input.repositoryRoot);

    appendChangeDocumentationLog({
      event: "change_documentation_end",
      level: validation.decision === "pass" ? "info" : "warn",
      details: `Documentation ${validation.decision.toUpperCase()} · ${records.length} records · ${report.durationMs}ms`,
    });

    return report;
  }

  private documentFinalStatus(
    sources: Parameters<ChangeSourceCollector["collect"]>[0],
    config: ChangeDocumentationConfiguration,
  ): ChangeDocumentationRecord[] {
    const validationDecision = sources.validationReport?.validation.decision;
    const regressionDecision = sources.regressionReport?.validation.decision;

    let changeType: ChangeType | null = null;
    if (validationDecision === "fail" || validationDecision === "blocked") {
      changeType = "rejected_change";
    } else if (regressionDecision === "fail" || regressionDecision === "blocked") {
      changeType = "rejected_change";
    } else if (
      sources.frontendBuild?.records.some((r) => r.buildStatus === "failed") ||
      sources.previewGeneration?.records.some((p) => p.buildStatus === "failed")
    ) {
      changeType = "failed_change";
    } else if (validationDecision === "pass" && regressionDecision === "pass") {
      changeType = "accepted_change";
    }

    if (!changeType || !config.supportedChangeTypes.includes(changeType)) return [];

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
        sourceRegressionReportId: sources.regressionReport?.regressionRunReportId ?? null,
        sourceRollbackReportId: sources.rollbackReport?.rollbackRunReportId ?? null,
        affectedScreenIds: [],
        affectedRouteOrViewIds: [],
        affectedComponentIds:
          sources.componentGeneration?.records.map((r) => r.componentGenerationId) ?? [],
        affectedLayoutRegionIds: [],
        affectedFiles,
        changeSummary: this.summary.generate(changeType, sources),
        uxRationale: this.rationale.generate(sources, config),
        safetySummary: `Validation: ${validationDecision ?? "n/a"}; Regression: ${regressionDecision ?? "n/a"}`,
        validationSummary: validationDecision ?? "not_run",
        regressionSummary: regressionDecision ?? "not_run",
        rollbackSummary: sources.rollbackReport ? sources.rollbackReport.validation.decision : null,
        finalChangeStatus:
          changeType === "accepted_change"
            ? "accepted"
            : changeType === "rejected_change"
              ? "rejected"
              : "failed",
        evidenceReferences: [
          sources.validationReport?.validationRunReportId,
          sources.regressionReport?.regressionRunReportId,
        ].filter((id): id is string => Boolean(id)),
        metadataVersion: CHANGE_METADATA_VERSION,
      }),
    ];
  }

  resetForTesting(): void {
    /* stateless pipeline */
  }
}
