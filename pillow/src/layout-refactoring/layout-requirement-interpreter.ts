/** T3-03 — Interprets layout refactoring requirements from upstream intelligence. */

import type { FrontendBuildRecord } from "../frontend-builder/types.js";
import type { LayoutEvaluationModel } from "../layout-evaluation-engine/types.js";
import type { RedesignProposal } from "../recommendation-engine/types.js";
import type { ComponentGenerationRecord } from "../component-generator/types.js";
import type { LayoutRefactoringConfiguration } from "./configuration.js";
import { appendRefactoringLog } from "./refactoring-logging.js";

export type LayoutRequirement = {
  recommendation: RedesignProposal;
  buildRecord: FrontendBuildRecord | null;
  layoutEvaluation: LayoutEvaluationModel | null;
  relatedComponents: ComponentGenerationRecord[];
  confidenceScore: number;
};

const LAYOUT_CATEGORIES = [
  "layout_improvement",
  "navigation_improvement",
  "dashboard_improvement",
  "form_usability_improvement",
  "table_improvement",
  "card_improvement",
  "modal_improvement",
  "drawer_improvement",
  "loading_state_improvement",
  "empty_state_improvement",
  "error_state_improvement",
  "workflow_improvement",
  "design_system_alignment",
  "visual_consistency_improvement",
] as const;

export class LayoutRequirementInterpreter {
  interpret(
    proposals: RedesignProposal[],
    buildRecords: FrontendBuildRecord[],
    layoutEvaluation: LayoutEvaluationModel | null,
    componentRecords: ComponentGenerationRecord[],
    config: LayoutRefactoringConfiguration,
  ): LayoutRequirement[] {
    appendRefactoringLog({
      event: "requirement_interpretation",
      level: "info",
      details: `Interpreting ${proposals.length} proposals · ${buildRecords.length} build records`,
    });

    const buildByRec = new Map(
      buildRecords.map((r) => [r.sourceRecommendationId, r]),
    );

    const fromProposals = proposals
      .filter((p) => {
        const confidence = p.confidenceScore / 100;
        if (confidence < config.minConfidenceThreshold) return false;
        if (config.requireApprovalThreshold) {
          return ["critical", "high", "medium"].includes(p.priority);
        }
        return true;
      })
      .filter((p) => LAYOUT_CATEGORIES.includes(p.recommendationCategory as (typeof LAYOUT_CATEGORIES)[number]))
      .map((p) => ({
        recommendation: p,
        buildRecord: buildByRec.get(p.recommendationId) ?? null,
        layoutEvaluation,
        relatedComponents: componentRecords.filter(
          (c) => c.sourceRecommendationId === p.recommendationId,
        ),
        confidenceScore: p.confidenceScore,
      }));

    if (fromProposals.length > 0) return fromProposals;

    if (layoutEvaluation && layoutEvaluation.layoutWeaknesses.length > 0) {
      const synthetic: RedesignProposal = {
        recommendationId: `rec-layout-eval-${layoutEvaluation.evaluationId}`,
        timestamp: new Date().toISOString(),
        screenId: layoutEvaluation.screenId,
        routeOrViewId: layoutEvaluation.routeOrViewId,
        recommendationTitle: "Layout evaluation weakness remediation",
        recommendationDescription: layoutEvaluation.layoutWeaknesses[0]!.description,
        recommendationCategory: "layout_improvement",
        affectedComponents: [],
        affectedLayoutRegions: [],
        affectedNavigationNodes: [],
        sourceUxScoreId: null,
        sourceFindingIds: [layoutEvaluation.layoutWeaknesses[0]!.findingId],
        evidenceReferences: layoutEvaluation.evidenceReferences,
        expectedUxBenefit: "Improved layout hierarchy and spacing",
        priority: "medium",
        severity: "warning",
        confidenceScore: layoutEvaluation.confidenceScore,
        executivePreferenceAlignment: true,
        designSystemAlignment: true,
        metadataVersion: layoutEvaluation.metadataVersion,
      };
      return [
        {
          recommendation: synthetic,
          buildRecord: null,
          layoutEvaluation,
          relatedComponents: componentRecords.slice(0, 3),
          confidenceScore: layoutEvaluation.confidenceScore,
        },
      ];
    }

    return [];
  }
}
