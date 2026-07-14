/** T1-07 — Active task inference from recent interactions. */

import type { InteractionEvent } from "../interaction-tracking-engine/types.js";
import type { InteractionType } from "../interaction-tracking-engine/types.js";

export type InferredTask = {
  task: string | null;
  confidence: number;
};

const TASK_BY_INTERACTION: Partial<Record<InteractionType, string>> = {
  click: "select_item",
  text_input: "edit_field",
  form_change: "edit_form",
  checkbox_change: "toggle_option",
  radio_change: "select_option",
  toggle_change: "toggle_setting",
  dropdown_select: "select_value",
  tab_switch: "switch_view",
  navigation_trigger: "navigate",
  route_change_trigger: "navigate",
  modal_open: "review_modal",
  modal_close: "dismiss_modal",
  drawer_open: "open_panel",
  drawer_close: "close_panel",
  scroll: "browse_content",
  keyboard_shortcut: "execute_shortcut",
};

export class ActiveTaskDetector {
  infer(recentEvents: InteractionEvent[]): InferredTask {
    if (recentEvents.length === 0) {
      return { task: "browsing", confidence: 0.6 };
    }

    const latest = recentEvents[recentEvents.length - 1]!;
    const task = TASK_BY_INTERACTION[latest.interactionType] ?? "interact";
    return { task, confidence: latest.confidence };
  }
}
