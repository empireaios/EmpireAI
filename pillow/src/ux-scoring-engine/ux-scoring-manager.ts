/** T2-08 — UX Scoring manager. */

import { appendScoringLog } from "./ux-scoring-logging.js";
import { ScoreReportGenerator } from "./score-report-generator.js";
import { ScoreValidator } from "./score-validator.js";
import type { UiStateModel } from "../ui-state-mapper/types.js";
import type { NavigationGraph } from "../navigation-mapping-engine/types.js";
import type { RuleValidationReport } from "../ux-rule-engine/types.js";
import type { DesignSystemModel } from "../design-system-intelligence-engine/types.js";
import type { ExecutiveStyleModel } from "../executive-style-learning-engine/types.js";
import type { LayoutEvaluationModel } from "../layout-evaluation-engine/types.js";
import type { WorkflowOptimizationRecord } from "../workflow-optimization-engine/types.js";
import type { AccessibilityReviewRecord } from "../accessibility-intelligence-engine/types.js";
import type { ConsistencyReviewRecord } from "../visual-consistency-engine/types.js";
import type { UxScoringConfiguration } from "./configuration.js";
import type { UxScoreRecord, UxScoringReport } from "./types.js";
import { SCORING_METADATA_VERSION } from "./paths.js";

export class UxScoringManager {
  private readonly reportGenerator = new ScoreReportGenerator();
  private readonly validator = new ScoreValidator();
  private latestRecord: UxScoreRecord | null = null;

  runScoring(input: {
    config: UxScoringConfiguration;
    uiState: UiStateModel | null;
    navigation: NavigationGraph | null;
    uxRules: RuleValidationReport | null;
    designSystem: DesignSystemModel | null;
    executiveStyle: ExecutiveStyleModel | null;
    layoutEvaluation: LayoutEvaluationModel | null;
    workflowOptimization: WorkflowOptimizationRecord | null;
    accessibility: AccessibilityReviewRecord | null;
    consistency: ConsistencyReviewRecord | null;
  }): UxScoringReport {
    const started = Date.now();

    appendScoringLog({
      event: "ux_scoring_start",
      level: "info",
      details: "Starting UX quality scoring",
    });

    const record = this.reportGenerator.build(input);

    for (const entry of record.scoreBreakdown) {
      appendScoringLog({
        event: "category_scoring",
        level: "info",
        details: `${entry.category}: ${entry.score} (weight ${entry.weight})`,
      });
    }

    appendScoringLog({
      event: "overall_score_aggregation",
      level: "info",
      details: `Overall UX score: ${record.overallUxScore}`,
    });

    const validation = this.validator.validate(record, input.config);
    this.latestRecord = record;

    const report: UxScoringReport = {
      scoringReportId: `uxs-report-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      scoringTimestamp: new Date().toISOString(),
      record,
      validation,
      durationMs: Date.now() - started,
      metadataVersion: SCORING_METADATA_VERSION,
    };

    appendScoringLog({
      event: "ux_scoring_end",
      level: validation.decision === "pass" ? "info" : "warn",
      details: `Scoring ${validation.decision.toUpperCase()} · overall ${record.overallUxScore} · ${report.durationMs}ms`,
    });

    return report;
  }

  getLatestRecord(): UxScoreRecord | null {
    return this.latestRecord;
  }

  reset(): void {
    this.latestRecord = null;
  }
}
