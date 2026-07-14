/** T1-07 — Active modal and drawer detection. */

import type { LayoutModel } from "../layout-understanding-engine/types.js";

export class ActiveModalDetector {
  detect(layout: LayoutModel | null): string | null {
    if (!layout) return null;
    const overlay = layout.regions.find(
      (r) => r.regionType === "modal" || r.regionType === "dialog" || r.regionType === "drawer",
    );
    return overlay?.regionId ?? null;
  }
}
