/** T1-04 — Stacking order inference. */

import type { UiComponent } from "../component-recognition-engine/types.js";
import type { StackingEntry } from "./types.js";

export function inferStackingOrder(components: UiComponent[]): StackingEntry[] {
  const entries: StackingEntry[] = components.map((c, index) => {
    let layer: StackingEntry["layer"] = "base";
    let zIndex = index;

    if (c.componentType === "modal" || c.componentType === "dialog") {
      layer = "modal";
      zIndex = 1000 + index;
    } else if (
      c.componentType === "alert" ||
      c.componentType === "toast" ||
      c.componentType === "tooltip"
    ) {
      layer = "overlay";
      zIndex = 500 + index;
    }

    return { id: c.componentId, zIndex, layer };
  });

  return entries.sort((a, b) => a.zIndex - b.zIndex);
}
