/** T2-01 — UI state rule evaluator. */

import type { UiStateModel } from "../ui-state-mapper/types.js";
import type { UxRule } from "./types.js";

export type UiStateEvaluationOutcome = {
  passed: boolean;
  description: string;
  evidence: Record<string, unknown>;
  sourceUiStateId: string | null;
  affectedScreenId: string | null;
};

export class UiStateRuleEvaluator {
  evaluate(rule: UxRule, uiState: UiStateModel | null): UiStateEvaluationOutcome {
    if (!uiState) {
      return {
        passed: false,
        description: "No UI state data available for evaluation",
        evidence: { reason: "missing_ui_state" },
        sourceUiStateId: null,
        affectedScreenId: null,
      };
    }

    const evaluator = rule.evaluationLogic.evaluator;
    const params = rule.evaluationLogic.parameters;
    const screenId = uiState.screen.screenId;
    const stateId = uiState.metadata.stateId;

    switch (evaluator) {
      case "ui_state_has_screen_id":
        return {
          passed: !!screenId,
          description: screenId
            ? `Screen ID present: ${screenId}`
            : "UI state missing screen identifier",
          evidence: { screenId, stateId },
          sourceUiStateId: stateId,
          affectedScreenId: screenId,
        };

      case "ui_state_has_regions": {
        const minRegions = Number(params.minRegions ?? 1);
        const visibleRegions = uiState.screen.regions.filter(
          (r) => r.visibility === "visible",
        );
        return {
          passed: visibleRegions.length >= minRegions,
          description:
            visibleRegions.length >= minRegions
              ? `${visibleRegions.length} visible regions detected`
              : `Only ${visibleRegions.length} visible regions (minimum ${minRegions})`,
          evidence: {
            visibleRegionCount: visibleRegions.length,
            minRegions,
          },
          sourceUiStateId: stateId,
          affectedScreenId: screenId,
        };
      }

      case "ui_state_min_viewport": {
        const minWidth = Number(params.minWidth ?? 320);
        const minHeight = Number(params.minHeight ?? 240);
        const { width, height } = uiState.screen.viewport;
        const passed = width >= minWidth && height >= minHeight;
        return {
          passed,
          description: passed
            ? `Viewport ${width}x${height} meets minimum`
            : `Viewport ${width}x${height} below minimum ${minWidth}x${minHeight}`,
          evidence: { width, height, minWidth, minHeight },
          sourceUiStateId: stateId,
          affectedScreenId: screenId,
        };
      }

      default:
        return {
          passed: true,
          description: `Unknown UI state evaluator '${evaluator}' — skipped`,
          evidence: { evaluator, skipped: true },
          sourceUiStateId: stateId,
          affectedScreenId: screenId,
        };
    }
  }
}
