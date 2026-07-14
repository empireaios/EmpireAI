/** T1-03 — Deterministic component type classification rules. */

import type { ComponentType } from "./types.js";
import type { UiRegion } from "../ui-state-mapper/types.js";

export type ComponentTypeRule = {
  componentType: ComponentType;
  minWidthRatio: number;
  maxWidthRatio: number;
  minHeightRatio: number;
  maxHeightRatio: number;
  minXRatio: number;
  maxXRatio: number;
  minYRatio: number;
  maxYRatio: number;
  baseConfidence: number;
};

export const DEFAULT_COMPONENT_TYPE_RULES: ComponentTypeRule[] = [
  {
    componentType: "header",
    minWidthRatio: 0.7,
    maxWidthRatio: 1,
    minHeightRatio: 0,
    maxHeightRatio: 0.12,
    minXRatio: 0,
    maxXRatio: 1,
    minYRatio: 0,
    maxYRatio: 0.15,
    baseConfidence: 0.85,
  },
  {
    componentType: "footer",
    minWidthRatio: 0.7,
    maxWidthRatio: 1,
    minHeightRatio: 0,
    maxHeightRatio: 0.12,
    minXRatio: 0,
    maxXRatio: 1,
    minYRatio: 0.85,
    maxYRatio: 1,
    baseConfidence: 0.85,
  },
  {
    componentType: "sidebar",
    minWidthRatio: 0,
    maxWidthRatio: 0.25,
    minHeightRatio: 0.2,
    maxHeightRatio: 1,
    minXRatio: 0,
    maxXRatio: 0.2,
    minYRatio: 0.1,
    maxYRatio: 0.9,
    baseConfidence: 0.8,
  },
  {
    componentType: "navigation_item",
    minWidthRatio: 0.05,
    maxWidthRatio: 0.3,
    minHeightRatio: 0,
    maxHeightRatio: 0.08,
    minXRatio: 0,
    maxXRatio: 1,
    minYRatio: 0,
    maxYRatio: 0.15,
    baseConfidence: 0.75,
  },
  {
    componentType: "tab",
    minWidthRatio: 0.04,
    maxWidthRatio: 0.2,
    minHeightRatio: 0,
    maxHeightRatio: 0.06,
    minXRatio: 0,
    maxXRatio: 1,
    minYRatio: 0,
    maxYRatio: 0.2,
    baseConfidence: 0.72,
  },
  {
    componentType: "button",
    minWidthRatio: 0.03,
    maxWidthRatio: 0.25,
    minHeightRatio: 0.02,
    maxHeightRatio: 0.1,
    minXRatio: 0,
    maxXRatio: 1,
    minYRatio: 0,
    maxYRatio: 1,
    baseConfidence: 0.7,
  },
  {
    componentType: "input",
    minWidthRatio: 0.1,
    maxWidthRatio: 0.6,
    minHeightRatio: 0.02,
    maxHeightRatio: 0.08,
    minXRatio: 0,
    maxXRatio: 1,
    minYRatio: 0,
    maxYRatio: 1,
    baseConfidence: 0.68,
  },
  {
    componentType: "text_field",
    minWidthRatio: 0.08,
    maxWidthRatio: 0.5,
    minHeightRatio: 0.02,
    maxHeightRatio: 0.07,
    minXRatio: 0,
    maxXRatio: 1,
    minYRatio: 0,
    maxYRatio: 1,
    baseConfidence: 0.65,
  },
  {
    componentType: "icon",
    minWidthRatio: 0,
    maxWidthRatio: 0.06,
    minHeightRatio: 0,
    maxHeightRatio: 0.06,
    minXRatio: 0,
    maxXRatio: 1,
    minYRatio: 0,
    maxYRatio: 1,
    baseConfidence: 0.6,
  },
  {
    componentType: "card",
    minWidthRatio: 0.15,
    maxWidthRatio: 0.5,
    minHeightRatio: 0.1,
    maxHeightRatio: 0.4,
    minXRatio: 0,
    maxXRatio: 1,
    minYRatio: 0.1,
    maxYRatio: 0.9,
    baseConfidence: 0.7,
  },
  {
    componentType: "panel",
    minWidthRatio: 0.2,
    maxWidthRatio: 1,
    minHeightRatio: 0.15,
    maxHeightRatio: 1,
    minXRatio: 0,
    maxXRatio: 1,
    minYRatio: 0,
    maxYRatio: 1,
    baseConfidence: 0.75,
  },
  {
    componentType: "table",
    minWidthRatio: 0.3,
    maxWidthRatio: 1,
    minHeightRatio: 0.15,
    maxHeightRatio: 0.8,
    minXRatio: 0,
    maxXRatio: 1,
    minYRatio: 0.1,
    maxYRatio: 0.9,
    baseConfidence: 0.72,
  },
  {
    componentType: "list",
    minWidthRatio: 0.1,
    maxWidthRatio: 0.6,
    minHeightRatio: 0.1,
    maxHeightRatio: 0.6,
    minXRatio: 0,
    maxXRatio: 1,
    minYRatio: 0,
    maxYRatio: 1,
    baseConfidence: 0.68,
  },
  {
    componentType: "form",
    minWidthRatio: 0.2,
    maxWidthRatio: 0.8,
    minHeightRatio: 0.2,
    maxHeightRatio: 0.9,
    minXRatio: 0,
    maxXRatio: 1,
    minYRatio: 0,
    maxYRatio: 1,
    baseConfidence: 0.7,
  },
  {
    componentType: "loading_indicator",
    minWidthRatio: 0,
    maxWidthRatio: 0.15,
    minHeightRatio: 0,
    maxHeightRatio: 0.15,
    minXRatio: 0.3,
    maxXRatio: 0.7,
    minYRatio: 0.3,
    maxYRatio: 0.7,
    baseConfidence: 0.55,
  },
  {
    componentType: "alert",
    minWidthRatio: 0.2,
    maxWidthRatio: 0.8,
    minHeightRatio: 0.03,
    maxHeightRatio: 0.12,
    minXRatio: 0,
    maxXRatio: 1,
    minYRatio: 0,
    maxYRatio: 0.3,
    baseConfidence: 0.65,
  },
];

export function classifyRegion(
  region: UiRegion,
  viewport: { width: number; height: number },
  rules: ComponentTypeRule[],
): { componentType: import("./types.js").ComponentType; confidence: number } {
  const wRatio = region.bounds.width / Math.max(1, viewport.width);
  const hRatio = region.bounds.height / Math.max(1, viewport.height);
  const xRatio = region.bounds.x / Math.max(1, viewport.width);
  const yRatio = region.bounds.y / Math.max(1, viewport.height);

  let best: { componentType: import("./types.js").ComponentType; confidence: number } = {
    componentType: "unknown",
    confidence: 0.4,
  };

  for (const rule of rules) {
    if (
      wRatio >= rule.minWidthRatio &&
      wRatio <= rule.maxWidthRatio &&
      hRatio >= rule.minHeightRatio &&
      hRatio <= rule.maxHeightRatio &&
      xRatio >= rule.minXRatio &&
      xRatio <= rule.maxXRatio &&
      yRatio >= rule.minYRatio &&
      yRatio <= rule.maxYRatio
    ) {
      if (rule.baseConfidence > best.confidence) {
        best = { componentType: rule.componentType, confidence: rule.baseConfidence };
      }
    }
  }

  if (region.visibility === "hidden") {
    return { componentType: "loading_indicator", confidence: 0.5 };
  }

  return best;
}
