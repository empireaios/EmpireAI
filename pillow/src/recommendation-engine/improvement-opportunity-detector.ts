/** T2-09 — Improvement opportunity detection. */

import type { UxScoreRecord } from "../ux-scoring-engine/types.js";
import type { RuleValidationReport } from "../ux-rule-engine/types.js";
import type { LayoutEvaluationModel } from "../layout-evaluation-engine/types.js";
import type { WorkflowOptimizationRecord } from "../workflow-optimization-engine/types.js";
import type { AccessibilityReviewRecord } from "../accessibility-intelligence-engine/types.js";
import type { ConsistencyReviewRecord } from "../visual-consistency-engine/types.js";
import { appendRecommendationLog } from "./recommendation-logging.js";

export type ImprovementOpportunity = {
  opportunityId: string;
  source: string;
  sourceId: string;
  category: string;
  description: string;
  severity: "error" | "warning" | "info";
  affectedComponentId: string | null;
  affectedLayoutRegionId: string | null;
  affectedNavigationNodeId: string | null;
  confidence: number;
  scoreImpact: number;
};

export class ImprovementOpportunityDetector {
  detect(input: {
    uxScore: UxScoreRecord | null;
    uxRules: RuleValidationReport | null;
    layoutEvaluation: LayoutEvaluationModel | null;
    workflowOptimization: WorkflowOptimizationRecord | null;
    accessibility: AccessibilityReviewRecord | null;
    consistency: ConsistencyReviewRecord | null;
  }): ImprovementOpportunity[] {
    const opportunities: ImprovementOpportunity[] = [];
    const now = Date.now();

    if (input.uxScore) {
      for (const entry of input.uxScore.scoreBreakdown) {
        if (entry.score < 70 && entry.findingsCount > 0) {
          opportunities.push({
            opportunityId: `opp-score-${entry.category}-${now}`,
            source: "T2-08",
            sourceId: input.uxScore.uxScoreId,
            category: entry.category,
            description: `Low UX score in ${entry.category.replace(/_/g, " ")} (${entry.score}/100)`,
            severity: entry.score < 50 ? "error" : "warning",
            affectedComponentId: null,
            affectedLayoutRegionId: null,
            affectedNavigationNodeId: null,
            confidence: input.uxScore.confidenceScore / 100,
            scoreImpact: 100 - entry.score,
          });
        }
      }
    }

    for (const v of input.uxRules?.violations ?? []) {
      opportunities.push({
        opportunityId: `opp-rule-${v.violationId}`,
        source: "T2-01",
        sourceId: v.violationId,
        category: v.category,
        description: v.violationDescription,
        severity: v.severity === "error" ? "error" : v.severity === "warning" ? "warning" : "info",
        affectedComponentId: v.sourceComponentId,
        affectedLayoutRegionId: null,
        affectedNavigationNodeId: v.sourceNavigationNodeId,
        confidence: 0.8,
        scoreImpact: 10,
      });
    }

    for (const w of input.layoutEvaluation?.layoutWeaknesses ?? []) {
      opportunities.push({
        opportunityId: `opp-layout-${w.findingId}`,
        source: "T2-04",
        sourceId: w.findingId,
        category: w.category,
        description: w.description,
        severity: w.severity,
        affectedComponentId: null,
        affectedLayoutRegionId: null,
        affectedNavigationNodeId: null,
        confidence: w.confidence,
        scoreImpact: 8,
      });
    }

    for (const f of input.workflowOptimization?.detectedFrictionPoints ?? []) {
      opportunities.push({
        opportunityId: `opp-wfo-${f.frictionId}`,
        source: "T2-05",
        sourceId: f.frictionId,
        category: f.category,
        description: f.description,
        severity: f.severity === "error" ? "error" : "warning",
        affectedComponentId: f.affectedComponents[0] ?? null,
        affectedLayoutRegionId: null,
        affectedNavigationNodeId: f.affectedNavigationNodes[0] ?? null,
        confidence: f.confidence,
        scoreImpact: 12,
      });
    }

    for (const f of input.accessibility?.accessibilityFindings ?? []) {
      opportunities.push({
        opportunityId: `opp-a11y-${f.findingId}`,
        source: "T2-06",
        sourceId: f.findingId,
        category: f.findingCategory,
        description: f.findingDescription,
        severity: f.severity,
        affectedComponentId: f.affectedComponentId,
        affectedLayoutRegionId: f.affectedLayoutRegionId,
        affectedNavigationNodeId: f.affectedNavigationNodeId,
        confidence: f.detectionConfidence,
        scoreImpact: 15,
      });
    }

    for (const f of input.consistency?.consistencyFindings ?? []) {
      opportunities.push({
        opportunityId: `opp-vce-${f.findingId}`,
        source: "T2-07",
        sourceId: f.findingId,
        category: f.findingCategory,
        description: f.findingDescription,
        severity: f.severity,
        affectedComponentId: f.affectedComponentId,
        affectedLayoutRegionId: f.affectedLayoutRegionId,
        affectedNavigationNodeId: f.affectedNavigationNodeId,
        confidence: f.detectionConfidence,
        scoreImpact: 8,
      });
    }

    for (const dev of input.layoutEvaluation?.executivePreferenceDeviations ?? []) {
      opportunities.push({
        opportunityId: `opp-exec-${dev.deviationId}`,
        source: "T2-03",
        sourceId: dev.deviationId,
        category: dev.category,
        description: dev.description,
        severity: dev.severity,
        affectedComponentId: null,
        affectedLayoutRegionId: null,
        affectedNavigationNodeId: null,
        confidence: 0.7,
        scoreImpact: 10,
      });
    }

    for (const dev of input.layoutEvaluation?.designSystemDeviations ?? []) {
      opportunities.push({
        opportunityId: `opp-dsi-${dev.deviationId}`,
        source: "T2-02",
        sourceId: dev.deviationId,
        category: dev.category,
        description: dev.description,
        severity: dev.severity,
        affectedComponentId: dev.componentId,
        affectedLayoutRegionId: null,
        affectedNavigationNodeId: null,
        confidence: 0.75,
        scoreImpact: 8,
      });
    }

    appendRecommendationLog({
      event: "opportunity_detection",
      level: "info",
      details: `Detected ${opportunities.length} improvement opportunities`,
    });

    return opportunities;
  }
}
