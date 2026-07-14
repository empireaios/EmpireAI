/** T2-02 — Layout standards intelligence. */

import type { LayoutModel } from "../layout-understanding-engine/types.js";
import type { LayoutStandard } from "./types.js";

export class LayoutStandardEngine {
  learn(layout: LayoutModel | null): LayoutStandard[] {
    if (!layout) {
      return [
        {
          standardId: "layout-default",
          name: "Default Layout",
          regionType: "content",
          minRegions: 1,
          alignmentRules: ["left", "top"],
          responsiveBreakpoints: ["desktop"],
        },
      ];
    }

    const regionTypes = [...new Set(layout.regions.map((r) => r.regionType))];
    const alignments = layout.alignmentRelationships.map((a) => a.alignment);
    const breakpoints = layout.responsiveBreakpoints
      .filter((b) => b.matched)
      .map((b) => b.name);

    return regionTypes.map((regionType) => ({
      standardId: `layout-${regionType}`,
      name: `${regionType} region standard`,
      regionType,
      minRegions: layout.regions.filter((r) => r.regionType === regionType).length,
      alignmentRules: alignments.length > 0 ? alignments : ["left"],
      responsiveBreakpoints: breakpoints.length > 0 ? breakpoints : ["desktop"],
    }));
  }
}
