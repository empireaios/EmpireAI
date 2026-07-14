/** T1-07 — Screen purpose detection from layout regions. */

import type { LayoutModel } from "../layout-understanding-engine/types.js";
import type { ContextState } from "./types.js";

export type ScreenPurposeRule = {
  regionType: string;
  purpose: string;
  contextState: ContextState;
  baseConfidence: number;
};

export const DEFAULT_SCREEN_PURPOSE_RULES: ScreenPurposeRule[] = [
  { regionType: "form_area", purpose: "form_completion", contextState: "form_completion", baseConfidence: 0.85 },
  { regionType: "table_area", purpose: "data_review", contextState: "reviewing", baseConfidence: 0.82 },
  { regionType: "chart_area", purpose: "dashboard_monitoring", contextState: "dashboard_monitoring", baseConfidence: 0.8 },
  { regionType: "search_area", purpose: "search", contextState: "searching", baseConfidence: 0.84 },
  { regionType: "filter_area", purpose: "filtering", contextState: "filtering", baseConfidence: 0.83 },
  { regionType: "modal", purpose: "modal_decision", contextState: "modal_decision", baseConfidence: 0.88 },
  { regionType: "dialog", purpose: "modal_decision", contextState: "modal_decision", baseConfidence: 0.88 },
  { regionType: "drawer", purpose: "panel_review", contextState: "reviewing", baseConfidence: 0.8 },
  { regionType: "loading_state", purpose: "loading", contextState: "loading", baseConfidence: 0.9 },
  { regionType: "empty_state", purpose: "browsing", contextState: "browsing", baseConfidence: 0.75 },
  { regionType: "main_content", purpose: "primary_view", contextState: "browsing", baseConfidence: 0.78 },
];

export type ScreenPurpose = {
  purpose: string;
  contextState: ContextState;
  confidence: number;
  regionId: string | null;
};

export class ScreenPurposeDetector {
  detect(layout: LayoutModel | null, rules: ScreenPurposeRule[]): ScreenPurpose {
    if (!layout || layout.regions.length === 0) {
      return { purpose: "unknown", contextState: "browsing", confidence: 0.5, regionId: null };
    }

    let best: ScreenPurpose = {
      purpose: "primary_view",
      contextState: "browsing",
      confidence: 0.6,
      regionId: layout.regions[0]?.regionId ?? null,
    };

    for (const region of layout.regions) {
      const rule = rules.find((r) => r.regionType === region.regionType);
      if (!rule) continue;
      const confidence = rule.baseConfidence * region.confidence;
      if (confidence > best.confidence) {
        best = {
          purpose: rule.purpose,
          contextState: rule.contextState,
          confidence,
          regionId: region.regionId,
        };
      }
    }

    return best;
  }
}
