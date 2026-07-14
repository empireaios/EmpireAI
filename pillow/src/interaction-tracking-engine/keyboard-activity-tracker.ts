/** T1-06 — Keyboard activity tracking. */

import type { RawInteractionInput, InteractionType } from "./types.js";

const KEYBOARD_TYPES: InteractionType[] = ["keyboard_input", "keyboard_shortcut"];

export class KeyboardActivityTracker {
  isKeyboardEvent(type: InteractionType): boolean {
    return KEYBOARD_TYPES.includes(type);
  }

  buildFromKeyboard(input: {
    interactionType: InteractionType;
    keyboardKey: string;
    componentId?: string;
    inputFieldId?: string;
  }): RawInteractionInput {
    return {
      interactionType: input.interactionType,
      keyboardKey: input.keyboardKey,
      componentId: input.componentId,
      inputFieldId: input.inputFieldId,
    };
  }

  isShortcut(key: string): boolean {
    return key.includes("+") || key === "Enter" || key === "Escape" || key === "Tab";
  }

  classifyKey(key: string): InteractionType {
    return this.isShortcut(key) ? "keyboard_shortcut" : "keyboard_input";
  }
}
