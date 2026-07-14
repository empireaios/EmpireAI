/** T2-08 — UX score report generation. */

import type { UiStateModel } from "../ui-state-mapper/types.js";
import type { NavigationGraph } from "../navigation-mapping-engine/types.js";
import type { RuleValidationReport } from "../ux-rule-engine/types.js";
import type { DesignSystemModel } from "../design-system-intelligence-engine/types.js";
import type { ExecutiveStyleModel } from "../executive-style-learning-engine/types.js";
import type { LayoutEvaluationModel } from "../layout-evaluation-engine/types.js";
import type { WorkflowOptimizationRecord } from "../workflow-optimization-engine/types.js";
import type { AccessibilityReviewRecord } from "../accessibility-intelligence-engine/types.js";
import type { ConsistencyReviewRecord } from "../visual-consistency-engine/types.js";
import { ScoreMetadataGenerator } from "./score-metadata-generator.js";
import { ScreenScoringEngine } from "./screen-scoring-engine.js";
import { ComponentScoringEngine } from "./component-scoring-engine.js";
import { LayoutScoringEngine } from "./layout-scoring-engine.js";
import { WorkflowScoringEngine } from "./workflow-scoring-engine.js";
import { AccessibilityScoringEngine } from "./accessibility-scoring-engine.js";
import { ConsistencyScoringEngine } from "./consistency-scoring-engine.js";
import { ExecutivePreferenceScoringEngine } from "./executive-preference-scoring-engine.js";
import { OverallScoreAggregator } from "./overall-score-aggregator.js";
import { averageConfidence } from "./scoring-helpers.js";
import type { UxScoreRecord, ScoreBreakdownEntry } from "./types.js";
import type { UxScoringConfiguration } from "./configuration.js";
import { SCORING_METADATA_VERSION } from "./paths.js";

export class ScoreReportGenerator {
  private readonly metadata = new ScoreMetadataGenerator();
  private readonly screenScoring = new ScreenScoringEngine();
  private readonly componentScoring = new ComponentScoringEngine();
  private readonly layoutScoring = new LayoutScoringEngine();
  private readonly workflowScoring = new WorkflowScoringEngine();
  private readonly accessibilityScoring = new AccessibilityScoringEngine();
  private readonly consistencyScoring = new ConsistencyScoringEngine();
  private readonly executiveScoring = new ExecutivePreferenceScoringEngine();
  private readonly aggregator = new OverallScoreAggregator();

  build(input: {
    uiState: UiStateModel | null;
    navigation: NavigationGraph | null;
    uxRules: RuleValidationReport | null;
    designSystem: DesignSystemModel | null;
    executiveStyle: ExecutiveStyleModel | null;
    layoutEvaluation: LayoutEvaluationModel | null;
    workflowOptimization: WorkflowOptimizationRecord | null;
    accessibility: AccessibilityReviewRecord | null;
    consistency: ConsistencyReviewRecord | null;
    config: UxScoringConfiguration;
  }): UxScoreRecord {
    const screen = this.screenScoring.score(input.uxRules, input.layoutEvaluation, input.config);
    const component = this.componentScoring.score(
      input.uxRules,
      input.consistency,
      input.designSystem,
      input.config,
    );
    const layout = this.layoutScoring.score(
      input.layoutEvaluation,
      input.consistency,
      input.config,
    );
    const workflow = this.workflowScoring.score(input.workflowOptimization, input.config);
    const accessibility = this.accessibilityScoring.score(input.accessibility, input.config);
    const consistency = this.consistencyScoring.score(input.consistency, input.config);
    const executive = this.executiveScoring.score(
      input.executiveStyle,
      input.layoutEvaluation,
      input.designSystem,
      input.uxRules,
      input.config,
    );

    const allBreakdown: ScoreBreakdownEntry[] = [
      ...screen.breakdown,
      ...component.breakdown,
      ...layout.breakdown,
      ...workflow.breakdown,
      ...accessibility.breakdown,
      ...consistency.breakdown,
      ...executive.breakdown,
    ];

    const confidenceValues = [
      input.layoutEvaluation?.confidenceScore ?? 0,
      input.workflowOptimization?.confidenceScore ?? 0,
      input.accessibility?.confidenceScore ?? 0,
      input.consistency?.confidenceScore ?? 0,
      input.executiveStyle?.confidenceScore ?? 0,
      input.uxRules ? (input.uxRules.rulesPassed / Math.max(input.uxRules.totalRules, 1)) * 100 : 0,
    ].map((v) => v / 100);

    const { overallUxScore, scoreBreakdown, confidenceScore } = this.aggregator.aggregate(
      {
        screenScore: screen.screenScore,
        componentScore: component.componentScore,
        layoutScore: layout.layoutScore,
        workflowScore: workflow.workflowScore,
        accessibilityScore: accessibility.accessibilityScore,
        consistencyScore: consistency.consistencyScore,
        executivePreferenceAlignmentScore: executive.executivePreferenceAlignmentScore,
      },
      allBreakdown,
      confidenceValues,
      input.config,
    );

    const evidenceReferences = [
      input.uxRules?.validationReportId,
      input.designSystem?.designSystemId,
      input.executiveStyle?.executiveStyleId,
      input.layoutEvaluation?.evaluationId,
      input.workflowOptimization?.optimizationRecordId,
      input.accessibility?.accessibilityReviewId,
      input.consistency?.consistencyReviewId,
      ...scoreBreakdown.map((b) => b.evidenceRef).filter((r): r is string => !!r),
    ].filter((ref): ref is string => !!ref);

    return this.metadata.enrichRecord({
      uxScoreId: this.metadata.buildScoreId(),
      timestamp: new Date().toISOString(),
      screenId:
        input.uiState?.screen.screenId ??
        input.layoutEvaluation?.screenId ??
        input.navigation?.metadata.currentScreenId ??
        null,
      routeOrViewId:
        input.navigation?.metadata.currentRouteId ??
        input.navigation?.metadata.currentViewId ??
        input.layoutEvaluation?.routeOrViewId ??
        null,
      sourceUxRuleResultIds: input.uxRules ? [input.uxRules.validationReportId] : [],
      sourceDesignSystemId: input.designSystem?.designSystemId ?? null,
      sourceExecutiveStyleId: input.executiveStyle?.executiveStyleId ?? null,
      sourceLayoutEvaluationId: input.layoutEvaluation?.evaluationId ?? null,
      sourceWorkflowOptimizationId: input.workflowOptimization?.optimizationRecordId ?? null,
      sourceAccessibilityReviewId: input.accessibility?.accessibilityReviewId ?? null,
      sourceConsistencyReviewId: input.consistency?.consistencyReviewId ?? null,
      overallUxScore,
      screenScore: screen.screenScore,
      componentScore: component.componentScore,
      layoutScore: layout.layoutScore,
      workflowScore: workflow.workflowScore,
      accessibilityScore: accessibility.accessibilityScore,
      consistencyScore: consistency.consistencyScore,
      executivePreferenceAlignmentScore: executive.executivePreferenceAlignmentScore,
      scoreBreakdown,
      scoreEvidenceReferences: [...new Set(evidenceReferences)],
      confidenceScore: confidenceScore || Math.round(averageConfidence(confidenceValues) * 100),
      metadataVersion: SCORING_METADATA_VERSION,
    });
  }
}
