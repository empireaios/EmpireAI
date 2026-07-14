/** T1-06 — Input and form activity tracking. */

import type { InteractionTrackingConfiguration } from "./configuration.js";
import { isSensitiveField } from "./sensitive-field-rules.js";
import type { RawInteractionInput, InteractionType } from "./types.js";

const INPUT_TYPES: InteractionType[] = [
  "text_input",
  "form_change",
  "selection_change",
  "dropdown_open",
  "dropdown_select",
  "checkbox_change",
  "radio_change",
  "toggle_change",
  "focus",
  "blur",
];

export class InputActivityTracker {
  isInputEvent(type: InteractionType): boolean {
    return INPUT_TYPES.includes(type);
  }

  buildFromInput(input: {
    interactionType: InteractionType;
    inputFieldId: string;
    previousValue?: string;
    newValue?: string;
    componentId?: string;
    config: InteractionTrackingConfiguration;
  }): RawInteractionInput | null {
    if (!input.config.captureInputChanges && this.isInputEvent(input.interactionType)) {
      if (isSensitiveField(input.inputFieldId, input.config)) return null;
    }
    return {
      interactionType: input.interactionType,
      inputFieldId: input.inputFieldId,
      previousValue: input.previousValue,
      newValue: input.newValue,
      componentId: input.componentId,
    };
  }

  inferFromComponentType(componentType: string): InteractionType | null {
    switch (componentType) {
      case "checkbox":
        return "checkbox_change";
      case "radio_button":
        return "radio_change";
      case "toggle":
        return "toggle_change";
      case "dropdown":
        return "dropdown_select";
      case "input":
      case "text_field":
      case "text_area":
        return "text_input";
      case "form":
        return "form_change";
      default:
        return null;
    }
  }
}
