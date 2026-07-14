/** T2-07 — Visual Consistency manager. */

import { appendConsistencyLog } from "./visual-consistency-logging.js";
import { ConsistencyCheckingEngine } from "./consistency-checking-engine.js";
import { ConsistencyFindingGenerator } from "./consistency-finding-generator.js";
import { ConsistencyValidator } from "./consistency-validator.js";
import type { UiStateModel } from "../ui-state-mapper/types.js";
import type { ComponentRecognitionResult } from "../component-recognition-engine/types.js";
import type { LayoutModel } from "../layout-understanding-engine/types.js";
import type { NavigationGraph } from "../navigation-mapping-engine/types.js";
import type { DesignSystemModel } from "../design-system-intelligence-engine/types.js";
import type { ExecutiveStyleModel } from "../executive-style-learning-engine/types.js";
import type { LayoutEvaluationModel } from "../layout-evaluation-engine/types.js";
import type { AccessibilityReviewRecord } from "../accessibility-intelligence-engine/types.js";
import type { VisualConsistencyConfiguration } from "./configuration.js";
import type { ConsistencyReviewRecord, ConsistencyReviewReport } from "./types.js";
import { CONSISTENCY_METADATA_VERSION } from "./paths.js";

export class VisualConsistencyManager {
  private readonly checkingEngine = new ConsistencyCheckingEngine();
  private readonly findingGenerator = new ConsistencyFindingGenerator();
  private readonly validator = new ConsistencyValidator();
  private latestRecord: ConsistencyReviewRecord | null = null;

  runReview(input: {
    config: VisualConsistencyConfiguration;
    uiState: UiStateModel | null;
    recognition: ComponentRecognitionResult | null;
    layout: LayoutModel | null;
    navigation: NavigationGraph | null;
    designSystem: DesignSystemModel | null;
    executiveStyle: ExecutiveStyleModel | null;
    layoutEvaluation: LayoutEvaluationModel | null;
    accessibilityReview: AccessibilityReviewRecord | null;
  }): ConsistencyReviewReport {
    const started = Date.now();

    appendConsistencyLog({
      event: "consistency_review_start",
      level: "info",
      details: "Starting visual consistency review",
    });

    const components = input.recognition?.components ?? [];
    const { findings, strengths } = this.checkingEngine.review({
      uiState: input.uiState,
      components,
      layout: input.layout,
      navigation: input.navigation,
      designSystem: input.designSystem,
      executiveStyle: input.executiveStyle,
      layoutEvaluation: input.layoutEvaluation,
      accessibilityReview: input.accessibilityReview,
      config: input.config,
    });

    for (const finding of findings) {
      appendConsistencyLog({
        event: "consistency_finding",
        level: finding.severity === "error" ? "error" : "warn",
        details: `${finding.findingCategory}: ${finding.findingDescription}`,
      });
    }

    const record = this.findingGenerator.build({
      uiState: input.uiState,
      recognition: input.recognition,
      layout: input.layout,
      navigation: input.navigation,
      designSystem: input.designSystem,
      executiveStyle: input.executiveStyle,
      layoutEvaluation: input.layoutEvaluation,
      accessibilityReview: input.accessibilityReview,
      findings,
      strengths,
    });

    const validation = this.validator.validate(record, input.config.validationRulesEnabled);
    this.latestRecord = record;

    const report: ConsistencyReviewReport = {
      reviewReportId: `vce-report-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      reviewTimestamp: new Date().toISOString(),
      record,
      validation,
      durationMs: Date.now() - started,
      metadataVersion: CONSISTENCY_METADATA_VERSION,
    };

    appendConsistencyLog({
      event: "consistency_review_end",
      level: validation.decision === "pass" ? "info" : "warn",
      details: `Review ${validation.decision.toUpperCase()} · ${findings.length} findings · ${strengths.length} strengths · ${report.durationMs}ms`,
    });

    return report;
  }

  getLatestRecord(): ConsistencyReviewRecord | null {
    return this.latestRecord;
  }

  reset(): void {
    this.latestRecord = null;
  }
}
