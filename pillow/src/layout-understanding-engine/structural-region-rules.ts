/** T1-04 — Structural region detection rules. */

import type { ComponentType } from "../component-recognition-engine/types.js";
import type { UiComponent } from "../component-recognition-engine/types.js";
import type { StructuralRegion, StructuralRegionType } from "./types.js";

export type StructuralRegionRule = {
  regionType: StructuralRegionType;
  componentTypes: ComponentType[];
  minYRatio: number;
  maxYRatio: number;
  minXRatio: number;
  maxXRatio: number;
  baseConfidence: number;
};

export const DEFAULT_STRUCTURAL_REGION_RULES: StructuralRegionRule[] = [
  {
    regionType: "header",
    componentTypes: ["header", "navigation_item", "tab"],
    minYRatio: 0,
    maxYRatio: 0.15,
    minXRatio: 0,
    maxXRatio: 1,
    baseConfidence: 0.85,
  },
  {
    regionType: "top_navigation",
    componentTypes: ["navigation_item", "tab", "menu", "link"],
    minYRatio: 0,
    maxYRatio: 0.12,
    minXRatio: 0,
    maxXRatio: 1,
    baseConfidence: 0.8,
  },
  {
    regionType: "sidebar",
    componentTypes: ["sidebar", "navigation_item", "list", "panel"],
    minYRatio: 0.1,
    maxYRatio: 0.9,
    minXRatio: 0,
    maxXRatio: 0.25,
    baseConfidence: 0.82,
  },
  {
    regionType: "footer",
    componentTypes: ["footer", "link", "button"],
    minYRatio: 0.85,
    maxYRatio: 1,
    minXRatio: 0,
    maxXRatio: 1,
    baseConfidence: 0.85,
  },
  {
    regionType: "main_content",
    componentTypes: ["panel", "card", "table", "form", "list", "chart"],
    minYRatio: 0.1,
    maxYRatio: 0.85,
    minXRatio: 0.15,
    maxXRatio: 1,
    baseConfidence: 0.78,
  },
  {
    regionType: "panel",
    componentTypes: ["panel", "card"],
    minYRatio: 0,
    maxYRatio: 1,
    minXRatio: 0,
    maxXRatio: 1,
    baseConfidence: 0.75,
  },
  {
    regionType: "form_area",
    componentTypes: ["form", "input", "text_field", "text_area", "dropdown", "checkbox", "button"],
    minYRatio: 0,
    maxYRatio: 1,
    minXRatio: 0,
    maxXRatio: 1,
    baseConfidence: 0.72,
  },
  {
    regionType: "table_area",
    componentTypes: ["table", "list"],
    minYRatio: 0,
    maxYRatio: 1,
    minXRatio: 0,
    maxXRatio: 1,
    baseConfidence: 0.7,
  },
  {
    regionType: "modal",
    componentTypes: ["modal", "dialog"],
    minYRatio: 0.2,
    maxYRatio: 0.8,
    minXRatio: 0.2,
    maxXRatio: 0.8,
    baseConfidence: 0.8,
  },
  {
    regionType: "loading_state",
    componentTypes: ["loading_indicator"],
    minYRatio: 0,
    maxYRatio: 1,
    minXRatio: 0,
    maxXRatio: 1,
    baseConfidence: 0.6,
  },
  {
    regionType: "toolbar",
    componentTypes: ["button", "icon", "toggle", "dropdown"],
    minYRatio: 0,
    maxYRatio: 0.2,
    minXRatio: 0,
    maxXRatio: 1,
    baseConfidence: 0.68,
  },
  {
    regionType: "search_area",
    componentTypes: ["input", "text_field", "icon"],
    minYRatio: 0,
    maxYRatio: 0.2,
    minXRatio: 0.5,
    maxXRatio: 1,
    baseConfidence: 0.65,
  },
];

function mergeBounds(components: UiComponent[]) {
  const xs = components.map((c) => c.bounds.x);
  const ys = components.map((c) => c.bounds.y);
  const rights = components.map((c) => c.bounds.x + c.bounds.width);
  const bottoms = components.map((c) => c.bounds.y + c.bounds.height);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return {
    x,
    y,
    width: Math.max(...rights) - x,
    height: Math.max(...bottoms) - y,
  };
}

export class StructuralRegionDetector {
  detect(
    components: UiComponent[],
    viewport: { width: number; height: number },
    rules: StructuralRegionRule[],
    confidenceThreshold: number,
  ): StructuralRegion[] {
    const regions: StructuralRegion[] = [];
    const assigned = new Set<string>();

    for (const rule of rules) {
      const matched = components.filter((c) => {
        if (assigned.has(c.componentId)) return false;
        if (!rule.componentTypes.includes(c.componentType)) return false;
        const xRatio = c.bounds.x / Math.max(1, viewport.width);
        const yRatio = c.bounds.y / Math.max(1, viewport.height);
        return (
          xRatio >= rule.minXRatio &&
          xRatio <= rule.maxXRatio &&
          yRatio >= rule.minYRatio &&
          yRatio <= rule.maxYRatio
        );
      });

      if (matched.length === 0) continue;

      const bounds = mergeBounds(matched);
      const regionId = `layout-region-${rule.regionType}-${regions.length}`;
      if (rule.baseConfidence < confidenceThreshold) continue;

      for (const c of matched) assigned.add(c.componentId);

      regions.push({
        regionId,
        regionType: rule.regionType,
        bounds,
        componentIds: matched.map((c) => c.componentId),
        parentRegionId: null,
        childRegionIds: [],
        confidence: rule.baseConfidence,
      });
    }

    const unassigned = components.filter((c) => !assigned.has(c.componentId));
    if (unassigned.length > 0) {
      regions.push({
        regionId: `layout-region-main_content-fallback`,
        regionType: "main_content",
        bounds: mergeBounds(unassigned),
        componentIds: unassigned.map((c) => c.componentId),
        parentRegionId: null,
        childRegionIds: [],
        confidence: 0.55,
      });
    }

    return regions;
  }
}
