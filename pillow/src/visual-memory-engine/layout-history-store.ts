/** T1-08 — Layout history store. */

import type { LayoutModel } from "../layout-understanding-engine/types.js";

export class LayoutHistoryStore {
  extractSafe(layout: LayoutModel) {
    return {
      layoutId: layout.metadata.layoutId,
      screenId: layout.metadata.screenId,
      regionCount: layout.regions.length,
      regions: layout.regions.map((r) => ({
        regionId: r.regionId,
        regionType: r.regionType,
        componentCount: r.componentIds.length,
        confidence: r.confidence,
      })),
      changeSummary: layout.changeSummary,
    };
  }
}
