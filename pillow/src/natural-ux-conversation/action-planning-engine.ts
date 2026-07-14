/** T4-01 — Plans structured UX actions from interpreted intent. */

import type { IntentCategory, UxAction } from "./types.js";
import type { InterpretedUxIntent } from "./ux-intent-interpreter.js";
import { ConversationMetadataGenerator } from "./conversation-metadata-generator.js";
import { appendConversationLog } from "./conversation-logging.js";

const ACTION_MAP: Record<IntentCategory, { actionType: string; description: string; priority: UxAction["priority"] }> = {
  layout_modification: {
    actionType: "plan_layout_change",
    description: "Plan layout structure or spacing improvements",
    priority: "high",
  },
  component_modification: {
    actionType: "plan_component_change",
    description: "Plan component-level UX improvements",
    priority: "high",
  },
  navigation_improvement: {
    actionType: "plan_navigation_change",
    description: "Plan navigation clarity improvements",
    priority: "medium",
  },
  workflow_improvement: {
    actionType: "plan_workflow_change",
    description: "Plan workflow friction reductions",
    priority: "high",
  },
  dashboard_improvement: {
    actionType: "plan_dashboard_change",
    description: "Plan dashboard information hierarchy improvements",
    priority: "medium",
  },
  form_improvement: {
    actionType: "plan_form_change",
    description: "Plan form usability improvements",
    priority: "medium",
  },
  table_improvement: {
    actionType: "plan_table_change",
    description: "Plan table readability and interaction improvements",
    priority: "medium",
  },
  card_improvement: {
    actionType: "plan_card_change",
    description: "Plan card presentation improvements",
    priority: "low",
  },
  theme_request: {
    actionType: "plan_theme_change",
    description: "Plan theme or styling updates via certified theme builder",
    priority: "medium",
  },
  ux_question: {
    actionType: "answer_ux_question",
    description: "Prepare UX guidance response",
    priority: "low",
  },
  design_question: {
    actionType: "answer_design_question",
    description: "Prepare design-system guidance response",
    priority: "low",
  },
  builder_request: {
    actionType: "prepare_builder_request",
    description: "Prepare structured request for certified builder",
    priority: "high",
  },
  review_request: {
    actionType: "request_ux_review",
    description: "Request UX review through certified intelligence",
    priority: "medium",
  },
  analysis_request: {
    actionType: "request_ux_analysis",
    description: "Request UX analysis through certified scoring",
    priority: "medium",
  },
  explanation_request: {
    actionType: "explain_ux_topic",
    description: "Explain UX rationale without executing changes",
    priority: "low",
  },
  general_ux_discussion: {
    actionType: "continue_ux_discussion",
    description: "Continue collaborative UX discussion",
    priority: "low",
  },
};

export class ActionPlanningEngine {
  private readonly metadata = new ConversationMetadataGenerator();

  plan(interpreted: InterpretedUxIntent): UxAction[] {
    appendConversationLog({
      event: "action_planning",
      level: "info",
      details: `Planning actions for ${interpreted.category}`,
    });

    const mapped = ACTION_MAP[interpreted.category];
    const actions: UxAction[] = [
      {
        actionId: this.metadata.buildActionId(),
        actionType: mapped.actionType,
        description: `${mapped.description}: ${interpreted.summary}`,
        targetCategory: interpreted.category,
        priority: mapped.priority,
      },
    ];

    if (interpreted.referencedScreens.length > 0) {
      actions.push({
        actionId: this.metadata.buildActionId(),
        actionType: "scope_to_screens",
        description: `Scope discussion to screens: ${interpreted.referencedScreens.join(", ")}`,
        targetCategory: interpreted.category,
        priority: "medium",
      });
    }

    return actions;
  }
}
