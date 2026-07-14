/** T1-05 — Navigation entry point detection rules. */

import type { StructuralRegion } from "../layout-understanding-engine/types.js";
import type { StructuralRegionType } from "../layout-understanding-engine/types.js";
import type { NavigationNodeKind } from "./types.js";

export type NavigationComponentRule = {
  regionType: StructuralRegionType;
  nodeKind: NavigationNodeKind;
  baseConfidence: number;
};

export const DEFAULT_NAVIGATION_COMPONENT_RULES: NavigationComponentRule[] = [
  { regionType: "sidebar", nodeKind: "nav_item", baseConfidence: 0.85 },
  { regionType: "top_navigation", nodeKind: "nav_item", baseConfidence: 0.82 },
  { regionType: "header", nodeKind: "nav_item", baseConfidence: 0.78 },
  { regionType: "toolbar", nodeKind: "nav_item", baseConfidence: 0.75 },
  { regionType: "modal", nodeKind: "modal", baseConfidence: 0.9 },
  { regionType: "dialog", nodeKind: "modal", baseConfidence: 0.9 },
  { regionType: "drawer", nodeKind: "drawer", baseConfidence: 0.88 },
];

export type NavigationEntry = {
  entryId: string;
  nodeKind: NavigationNodeKind;
  regionId: string;
  componentIds: string[];
  label: string;
  confidence: number;
  isEntryPoint: boolean;
  isDestination: boolean;
};

export class NavigationEntryDetector {
  detect(regions: StructuralRegion[], rules: NavigationComponentRule[]): NavigationEntry[] {
    const entries: NavigationEntry[] = [];
    const now = Date.now();

    for (const region of regions) {
      const rule = rules.find((r) => r.regionType === region.regionType);
      if (!rule) continue;

      if (region.componentIds.length === 0) {
        entries.push({
          entryId: `nav-entry-${region.regionId}`,
          nodeKind: rule.nodeKind,
          regionId: region.regionId,
          componentIds: [],
          label: region.regionType.replace(/_/g, " "),
          confidence: rule.baseConfidence * region.confidence,
          isEntryPoint: rule.nodeKind === "nav_item",
          isDestination: rule.nodeKind === "modal" || rule.nodeKind === "drawer",
        });
        continue;
      }

      for (const componentId of region.componentIds) {
        entries.push({
          entryId: `nav-entry-${componentId}-${now}`,
          nodeKind: rule.nodeKind,
          regionId: region.regionId,
          componentIds: [componentId],
          label: componentId.replace(/^cmp-/, "").replace(/-/g, " "),
          confidence: rule.baseConfidence * region.confidence,
          isEntryPoint: rule.nodeKind === "nav_item",
          isDestination:
            rule.nodeKind === "modal" || rule.nodeKind === "drawer" || rule.nodeKind === "nav_item",
        });
      }
    }

    return entries;
  }
}
