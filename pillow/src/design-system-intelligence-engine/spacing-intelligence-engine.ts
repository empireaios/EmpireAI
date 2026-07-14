/** T2-02 — Spacing standards intelligence. */

import type { LayoutModel } from "../layout-understanding-engine/types.js";
import type { SpacingToken } from "./types.js";

export class SpacingIntelligenceEngine {
  learn(layout: LayoutModel | null): SpacingToken[] {
    const base: SpacingToken[] = [
      { tokenId: "spacing-xs", name: "XS", valuePx: 4, usage: "Tight inline spacing" },
      { tokenId: "spacing-sm", name: "SM", valuePx: 8, usage: "Compact component padding" },
      { tokenId: "spacing-md", name: "MD", valuePx: 16, usage: "Default component spacing" },
      { tokenId: "spacing-lg", name: "LG", valuePx: 24, usage: "Section spacing" },
      { tokenId: "spacing-xl", name: "XL", valuePx: 32, usage: "Layout section gaps" },
    ];

    if (!layout) return base;

    const distances = layout.spatialRelationships.map((r) => r.distance).filter((d) => d > 0);
    if (distances.length === 0) return base;

    const avg = Math.round(distances.reduce((a, b) => a + b, 0) / distances.length);
    const nearest = base.reduce((prev, curr) =>
      Math.abs(curr.valuePx - avg) < Math.abs(prev.valuePx - avg) ? curr : prev,
    );
    nearest.usage = `Observed average region distance: ${avg}px`;

    return base;
  }
}
