/** T2-02 — Sizing standards intelligence. */

import type { DesignSystemComponent } from "./types.js";
import type { SizingToken } from "./types.js";

export class SizingIntelligenceEngine {
  learn(components: DesignSystemComponent[]): SizingToken[] {
    const bySize = new Map<string, { widths: number[]; heights: number[] }>();

    for (const component of components) {
      for (const size of component.sizeVariants) {
        const entry = bySize.get(size) ?? { widths: [], heights: [] };
        bySize.set(size, entry);
      }
    }

    const defaults: SizingToken[] = [
      { tokenId: "size-xs", name: "Extra Small", minWidthPx: 0, maxWidthPx: 80, minHeightPx: 0, maxHeightPx: 32, variant: "xs" },
      { tokenId: "size-sm", name: "Small", minWidthPx: 80, maxWidthPx: 160, minHeightPx: 32, maxHeightPx: 48, variant: "sm" },
      { tokenId: "size-md", name: "Medium", minWidthPx: 160, maxWidthPx: 320, minHeightPx: 48, maxHeightPx: 64, variant: "md" },
      { tokenId: "size-lg", name: "Large", minWidthPx: 320, maxWidthPx: 480, minHeightPx: 64, maxHeightPx: 96, variant: "lg" },
      { tokenId: "size-xl", name: "Extra Large", minWidthPx: 480, maxWidthPx: 9999, minHeightPx: 96, maxHeightPx: 9999, variant: "xl" },
    ];

    if (components.length === 0) return defaults;

    const usedSizes = new Set(components.flatMap((c) => c.sizeVariants));
    return defaults.filter((d) => usedSizes.has(d.variant));
  }
}
