/** T1-07 — Workflow context engine and interaction mode rules. */

import type { InteractionEvent } from "../interaction-tracking-engine/types.js";
import type { InteractionType } from "../interaction-tracking-engine/types.js";
import type { ContextState, InteractionMode } from "./types.js";
import type { ScreenPurpose } from "./screen-purpose-detector.js";

export type InteractionModeRule = {
  interactionTypes: InteractionType[];
  mode: InteractionMode;
  contextState: ContextState;
  baseConfidence: number;
};

export const DEFAULT_INTERACTION_MODE_RULES: InteractionModeRule[] = [
  { interactionTypes: ["text_input", "form_change"], mode: "edit", contextState: "editing", baseConfidence: 0.85 },
  { interactionTypes: ["click", "navigation_trigger"], mode: "navigate", contextState: "navigation", baseConfidence: 0.82 },
  { interactionTypes: ["modal_open", "modal_close"], mode: "review", contextState: "modal_decision", baseConfidence: 0.88 },
  { interactionTypes: ["dropdown_select", "checkbox_change", "radio_change", "toggle_change"], mode: "configure", contextState: "configuring", baseConfidence: 0.8 },
  { interactionTypes: ["scroll"], mode: "browse", contextState: "browsing", baseConfidence: 0.75 },
  { interactionTypes: ["route_change_trigger"], mode: "navigate", contextState: "navigation", baseConfidence: 0.84 },
];

export type ModeInference = {
  mode: InteractionMode;
  contextState: ContextState;
  confidence: number;
};

export class WorkflowContextEngine {
  inferMode(
    recentEvents: InteractionEvent[],
    screenPurpose: ScreenPurpose,
    rules: InteractionModeRule[],
  ): ModeInference {
    if (recentEvents.length === 0) {
      return {
        mode: screenPurpose.contextState === "loading" ? "wait" : "browse",
        contextState: screenPurpose.contextState,
        confidence: screenPurpose.confidence,
      };
    }

    const latest = recentEvents[recentEvents.length - 1]!;
    for (const rule of rules) {
      if (rule.interactionTypes.includes(latest.interactionType)) {
        return {
          mode: rule.mode,
          contextState: rule.contextState,
          confidence: rule.baseConfidence * latest.confidence,
        };
      }
    }

    if (screenPurpose.contextState === "form_completion") {
      return { mode: "edit", contextState: "form_completion", confidence: screenPurpose.confidence };
    }

    return {
      mode: "browse",
      contextState: screenPurpose.contextState,
      confidence: Math.max(screenPurpose.confidence, latest.confidence * 0.8),
    };
  }
}
