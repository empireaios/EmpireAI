/** T1-06 — Pointer activity tracking (click, hover). */

import type { RawInteractionInput, InteractionType } from "./types.js";

const POINTER_TYPES: InteractionType[] = ["click", "double_click", "right_click", "hover"];

export class PointerActivityTracker {
  isPointerEvent(type: InteractionType): boolean {
    return POINTER_TYPES.includes(type);
  }

  buildFromPointer(input: {
    interactionType: InteractionType;
    pointerX: number;
    pointerY: number;
    componentId?: string;
  }): RawInteractionInput {
    return {
      interactionType: input.interactionType,
      componentId: input.componentId,
      pointerX: input.pointerX,
      pointerY: input.pointerY,
    };
  }
}
