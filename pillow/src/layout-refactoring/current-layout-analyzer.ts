/** T3-03 — Analyzes current layout structure from upstream models. */

import type { LayoutModel } from "../layout-understanding-engine/types.js";
import type { LayoutEvaluationModel } from "../layout-evaluation-engine/types.js";
import type { LayoutRequirement } from "./layout-requirement-interpreter.js";
import { appendRefactoringLog } from "./refactoring-logging.js";

export type CurrentLayoutAnalysis = {
  screenId: string;
  routeOrViewId: string | null;
  regionCount: number;
  hierarchySummary: string[];
  spacingIssues: string[];
  alignmentIssues: string[];
  responsiveGaps: string[];
};

export class CurrentLayoutAnalyzer {
  analyze(
    requirement: LayoutRequirement,
    layoutModel: LayoutModel | null,
    layoutEvaluation: LayoutEvaluationModel | null,
  ): CurrentLayoutAnalysis {
    appendRefactoringLog({
      event: "current_layout_analysis",
      level: "info",
      details: `Analyzing layout for ${requirement.recommendation.recommendationId}`,
    });

    const screenId =
      layoutEvaluation?.screenId ??
      layoutModel?.metadata.layoutId ??
      requirement.recommendation.screenId ??
      "screen-primary";

    const regions = layoutModel?.regions ?? [];
    const weaknesses = layoutEvaluation?.layoutWeaknesses ?? [];

    return {
      screenId,
      routeOrViewId: layoutEvaluation?.routeOrViewId ?? null,
      regionCount: regions.length,
      hierarchySummary: regions.slice(0, 5).map((r) => `${r.regionType}: ${r.regionId}`),
      spacingIssues: weaknesses
        .filter((w) => w.category === "spacing" || w.category === "white_space")
        .map((w) => w.description)
        .slice(0, 3),
      alignmentIssues: weaknesses
        .filter((w) => w.category === "alignment")
        .map((w) => w.description)
        .slice(0, 3),
      responsiveGaps: weaknesses
        .filter((w) => w.category === "responsive_layout")
        .map((w) => w.description)
        .slice(0, 3),
    };
  }
}
