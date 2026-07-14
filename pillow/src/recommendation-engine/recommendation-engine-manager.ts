/** T2-09 — Recommendation Engine manager. */

import { appendRecommendationLog } from "./recommendation-logging.js";
import { ImprovementOpportunityDetector } from "./improvement-opportunity-detector.js";
import { RecommendationReportGenerator } from "./recommendation-report-generator.js";
import { RecommendationValidator } from "./recommendation-validator.js";
import { RecommendationMetadataGenerator } from "./recommendation-metadata-generator.js";
import { RecommendationEvidenceMapper } from "./recommendation-evidence-mapper.js";
import type { UiStateModel } from "../ui-state-mapper/types.js";
import type { NavigationGraph } from "../navigation-mapping-engine/types.js";
import type { RuleValidationReport } from "../ux-rule-engine/types.js";
import type { DesignSystemModel } from "../design-system-intelligence-engine/types.js";
import type { ExecutiveStyleModel } from "../executive-style-learning-engine/types.js";
import type { LayoutEvaluationModel } from "../layout-evaluation-engine/types.js";
import type { WorkflowOptimizationRecord } from "../workflow-optimization-engine/types.js";
import type { AccessibilityReviewRecord } from "../accessibility-intelligence-engine/types.js";
import type { ConsistencyReviewRecord } from "../visual-consistency-engine/types.js";
import type { UxScoreRecord } from "../ux-scoring-engine/types.js";
import type { RecommendationEngineConfiguration } from "./configuration.js";
import type { RecommendationRecord, RecommendationReport, RecommendationPriority } from "./types.js";
import { RECOMMENDATION_METADATA_VERSION } from "./paths.js";

export class RecommendationEngineManager {
  private readonly detector = new ImprovementOpportunityDetector();
  private readonly reportGenerator = new RecommendationReportGenerator();
  private readonly validator = new RecommendationValidator();
  private readonly metadata = new RecommendationMetadataGenerator();
  private readonly evidenceMapper = new RecommendationEvidenceMapper();
  private latestRecord: RecommendationRecord | null = null;

  generateReport(input: {
    config: RecommendationEngineConfiguration;
    uiState: UiStateModel | null;
    navigation: NavigationGraph | null;
    uxRules: RuleValidationReport | null;
    designSystem: DesignSystemModel | null;
    executiveStyle: ExecutiveStyleModel | null;
    layoutEvaluation: LayoutEvaluationModel | null;
    workflowOptimization: WorkflowOptimizationRecord | null;
    accessibility: AccessibilityReviewRecord | null;
    consistency: ConsistencyReviewRecord | null;
    uxScore: UxScoreRecord | null;
  }): RecommendationReport {
    const started = Date.now();

    appendRecommendationLog({
      event: "recommendation_engine_start",
      level: "info",
      details: "Starting recommendation report generation",
    });

    const opportunities = this.detector.detect({
      uxScore: input.uxScore,
      uxRules: input.uxRules,
      layoutEvaluation: input.layoutEvaluation,
      workflowOptimization: input.workflowOptimization,
      accessibility: input.accessibility,
      consistency: input.consistency,
    });

    const screenId =
      input.uiState?.screen.screenId ??
      input.uxScore?.screenId ??
      input.navigation?.metadata.currentScreenId ??
      null;
    const routeOrViewId =
      input.navigation?.metadata.currentRouteId ??
      input.navigation?.metadata.currentViewId ??
      input.uxScore?.routeOrViewId ??
      null;

    const proposals = this.reportGenerator.generateProposals({
      opportunities,
      uxScore: input.uxScore,
      executiveStyle: input.executiveStyle,
      designSystem: input.designSystem,
      screenId,
      routeOrViewId,
      config: input.config,
    });

    for (const proposal of proposals) {
      appendRecommendationLog({
        event: "recommendation_generated",
        level: proposal.severity === "error" ? "warn" : "info",
        details: `[${proposal.priority}] ${proposal.recommendationTitle}`,
      });
    }

    const overallPriority = this.computeOverallPriority(proposals);
    const confidenceValues = proposals.map((p) => p.confidenceScore).filter((c) => c > 0);
    const confidenceScore =
      confidenceValues.length > 0
        ? Math.round(confidenceValues.reduce((a, b) => a + b, 0) / confidenceValues.length)
        : 0;

    const record = this.metadata.enrichRecord({
      recommendationRecordId: this.metadata.buildRecordId(),
      timestamp: new Date().toISOString(),
      screenId,
      routeOrViewId,
      sourceUxScoreId: input.uxScore?.uxScoreId ?? null,
      sourceUxRuleResultIds: input.uxRules ? [input.uxRules.validationReportId] : [],
      sourceDesignSystemId: input.designSystem?.designSystemId ?? null,
      sourceExecutiveStyleId: input.executiveStyle?.executiveStyleId ?? null,
      sourceLayoutEvaluationId: input.layoutEvaluation?.evaluationId ?? null,
      sourceWorkflowOptimizationId: input.workflowOptimization?.optimizationRecordId ?? null,
      sourceAccessibilityReviewId: input.accessibility?.accessibilityReviewId ?? null,
      sourceConsistencyReviewId: input.consistency?.consistencyReviewId ?? null,
      proposals,
      prioritizedProposalIds: proposals.map((p) => p.recommendationId),
      evidenceReferences: this.evidenceMapper.collectRecordEvidence(proposals),
      overallPriority,
      confidenceScore,
      metadataVersion: RECOMMENDATION_METADATA_VERSION,
    });

    const validation = this.validator.validate(record, input.config);
    this.latestRecord = record;

    const report: RecommendationReport = {
      recommendationReportId: `rec-report-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      recommendationTimestamp: new Date().toISOString(),
      record,
      validation,
      durationMs: Date.now() - started,
      metadataVersion: RECOMMENDATION_METADATA_VERSION,
    };

    appendRecommendationLog({
      event: "recommendation_engine_end",
      level: validation.decision === "pass" ? "info" : "warn",
      details: `Report ${validation.decision.toUpperCase()} · ${proposals.length} proposals · ${report.durationMs}ms`,
    });

    return report;
  }

  getLatestRecord(): RecommendationRecord | null {
    return this.latestRecord;
  }

  reset(): void {
    this.latestRecord = null;
  }

  private computeOverallPriority(
    proposals: { priority: RecommendationPriority }[],
  ): RecommendationPriority {
    if (proposals.some((p) => p.priority === "critical")) return "critical";
    if (proposals.some((p) => p.priority === "high")) return "high";
    if (proposals.some((p) => p.priority === "medium")) return "medium";
    return "low";
  }
}
