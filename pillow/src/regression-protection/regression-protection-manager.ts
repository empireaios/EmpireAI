/** T3-07 — Regression Protection manager — core pipeline. */

import type { ComponentGenerationReport } from "../component-generator/types.js";
import type { FrontendBuildReport } from "../frontend-builder/types.js";
import type { LayoutModel } from "../layout-understanding-engine/types.js";
import type { NavigationGraph } from "../navigation-mapping-engine/types.js";
import type { PreviewGenerationReport } from "../preview-generator/types.js";
import type { RecommendationReport } from "../recommendation-engine/types.js";
import type { UxScoringReport } from "../ux-scoring-engine/types.js";
import type { ValidationRunReport } from "../validation-engine/types.js";
import type { VisualFoundationCertificationReport } from "../visual-foundation-certification-engine/types.js";
import type { RegressionProtectionConfiguration } from "./configuration.js";
import { BaselineUiStateManager } from "./baseline-ui-state-manager.js";
import { UxBaselineComparator } from "./ux-baseline-comparator.js";
import { RegressionDecisionEngine } from "./regression-decision-engine.js";
import { RegressionReportGenerator } from "./regression-report-generator.js";
import { RegressionValidator } from "./regression-validator.js";
import { RegressionMetadataGenerator } from "./regression-metadata-generator.js";
import type { RegressionProtectionReport, RegressionRunReport } from "./types.js";
import { REGRESSION_METADATA_VERSION } from "./paths.js";
import { appendRegressionLog } from "./regression-logging.js";

export class RegressionProtectionManager {
  private readonly baselineManager = new BaselineUiStateManager();
  private readonly comparator = new UxBaselineComparator();
  private readonly decisionEngine = new RegressionDecisionEngine();
  private readonly reportGenerator = new RegressionReportGenerator();
  private readonly validator = new RegressionValidator();
  private readonly metadata = new RegressionMetadataGenerator();

  runCheck(input: {
    config: RegressionProtectionConfiguration;
    validationReport: ValidationRunReport | null;
    previewGeneration: PreviewGenerationReport | null;
    frontendBuild: FrontendBuildReport | null;
    uxScoring: UxScoringReport | null;
    recommendationReport: RecommendationReport | null;
    componentGeneration: ComponentGenerationReport | null;
    layoutModel: LayoutModel | null;
    navigationGraph: NavigationGraph | null;
    visualFoundation: VisualFoundationCertificationReport | null;
  }): RegressionRunReport {
    const started = Date.now();

    appendRegressionLog({
      event: "regression_protection_start",
      level: "info",
      details: "Starting regression protection check",
    });

    const baseline = this.baselineManager.selectBaseline({
      config: input.config,
      validationReport: input.validationReport,
      uxScoring: input.uxScoring,
      previewGeneration: input.previewGeneration,
      frontendBuild: input.frontendBuild,
      visualFoundation: input.visualFoundation,
    });

    const proposed = this.comparator.buildProposedState({
      validationReport: input.validationReport,
      uxScoring: input.uxScoring,
      recommendationReport: input.recommendationReport,
      previewGeneration: input.previewGeneration,
      frontendBuild: input.frontendBuild,
    });

    const regressions = this.decisionEngine.detect({
      baseline,
      proposed,
      validationReport: input.validationReport,
      previewGeneration: input.previewGeneration,
      componentGeneration: input.componentGeneration,
      layoutModel: input.layoutModel,
      navigationGraph: input.navigationGraph,
      config: input.config,
    });

    const reports: RegressionProtectionReport[] = [];
    if (reports.length < input.config.maxReportsPerCheck) {
      reports.push(
        this.reportGenerator.buildReport({
          baseline,
          proposed,
          regressions,
          sourceValidationReportId:
            input.validationReport?.validationRunReportId ?? "rp-no-validation",
          sourcePreviewBuildId: proposed.sourcePreviewBuildId,
          sourceFrontendBuildRecordIds: proposed.sourceFrontendBuildRecordIds,
          sourceUxScoreId: proposed.sourceUxScoreId,
          sourceRecommendationId: proposed.sourceRecommendationId,
          protectedNavigationNodes: input.navigationGraph?.nodes.map((n) => n.nodeId) ?? [],
          finalDecision: "pass",
        }),
      );
    }

    const validation = this.validator.validate(reports, input.config);
    for (const report of reports) {
      report.finalProtectionDecision = validation.decision;
    }

    const runReport: RegressionRunReport = {
      regressionRunReportId: this.metadata.buildRunReportId(),
      runTimestamp: new Date().toISOString(),
      reports,
      validation,
      durationMs: Date.now() - started,
      metadataVersion: REGRESSION_METADATA_VERSION,
    };

    appendRegressionLog({
      event: "regression_protection_end",
      level: validation.decision === "pass" ? "info" : "warn",
      details: `Protection ${validation.decision.toUpperCase()} · ${validation.regressionsDetected} regressions · ${runReport.durationMs}ms`,
    });

    return runReport;
  }

  resetForTesting(): void {
    this.baselineManager.resetForTesting();
  }
}
