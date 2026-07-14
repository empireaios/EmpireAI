/** T1-06 — Scroll activity tracking. */

import type { RawInteractionInput, InteractionType } from "./types.js";

export class ScrollActivityTracker {
  isScrollEvent(type: InteractionType): boolean {
    return type === "scroll";
  }

  buildFromScroll(input: {
    direction: "up" | "down" | "left" | "right";
    distance: number;
    componentId?: string;
  }): RawInteractionInput {
    return {
      interactionType: "scroll",
      scrollDirection: input.direction,
      scrollDistance: input.distance,
      componentId: input.componentId,
    };
  }
}
