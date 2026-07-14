/** T2-01 — Layout rule evaluator. */

import type { LayoutModel } from "../layout-understanding-engine/types.js";
import type { UxRule } from "./types.js";

export type LayoutEvaluationOutcome = {
  passed: boolean;
  description: string;
  evidence: Record<string, unknown>;
  sourceLayoutId: string | null;
  sourceUiStateId: string | null;
  affectedScreenId: string | null;
};

export class LayoutRuleEvaluator {
  evaluate(rule: UxRule, layout: LayoutModel | null): LayoutEvaluationOutcome {
    if (!layout) {
      return {
        passed: false,
        description: "No layout data available for evaluation",
        evidence: { reason: "missing_layout_data" },
        sourceLayoutId: null,
        sourceUiStateId: null,
        affectedScreenId: null,
      };
    }

    const evaluator = rule.evaluationLogic.evaluator;
    const params = rule.evaluationLogic.parameters;
    const layoutId = layout.metadata.layoutId;
    const stateId = layout.metadata.sourceStateId;
    const screenId = layout.metadata.screenId ?? null;

    switch (evaluator) {
      case "layout_min_regions": {
        const minRegions = Number(params.minRegions ?? 1);
        return {
          passed: layout.regions.length >= minRegions,
          description:
            layout.regions.length >= minRegions
              ? `${layout.regions.length} layout regions detected`
              : `Only ${layout.regions.length} regions (minimum ${minRegions})`,
          evidence: { regionCount: layout.regions.length, minRegions },
          sourceLayoutId: layoutId,
          sourceUiStateId: stateId,
          affectedScreenId: screenId,
        };
      }

      case "layout_has_structure": {
        const hasHierarchy = layout.regionHierarchy.length > 0;
        return {
          passed: hasHierarchy,
          description: hasHierarchy
            ? `Layout defines ${layout.regionHierarchy.length} hierarchy nodes`
            : "Layout missing region hierarchy structure",
          evidence: {
            hierarchyNodeCount: layout.regionHierarchy.length,
          },
          sourceLayoutId: layoutId,
          sourceUiStateId: stateId,
          affectedScreenId: screenId,
        };
      }

      default:
        return {
          passed: true,
          description: `Unknown layout evaluator '${evaluator}' — skipped`,
          evidence: { evaluator, skipped: true },
          sourceLayoutId: layoutId,
          sourceUiStateId: stateId,
          affectedScreenId: screenId,
        };
    }
  }
}
