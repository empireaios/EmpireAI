/** T4-03 — Maps annotations to layout region IDs from T1. */

import type { LayoutUnderstandingEngine } from "../layout-understanding-engine/engine.js";
import type { UiStateMapperEngine } from "../ui-state-mapper/engine.js";
import type { ScreenAnnotationConfiguration } from "./configuration.js";
import type { AnnotationType, PointerCoordinates, ScreenRegionBounds } from "./types.js";
import { boundsOverlap, pointInBounds } from "./screen-coordinate-mapper.js";
import { appendAnnotationLog } from "./annotation-logging.js";

export class LayoutAnnotationMapper {
  map(input: {
    annotationType: AnnotationType;
    pointer: PointerCoordinates | null;
    bounds: ScreenRegionBounds | null;
    explicitIds: string[];
    config: ScreenAnnotationConfiguration;
    layoutUnderstanding: LayoutUnderstandingEngine | null;
    uiStateMapper: UiStateMapperEngine | null;
  }): { layoutRegionIds: string[]; confidence: number } {
    appendAnnotationLog({
      event: "layout_annotation_mapping",
      level: "info",
      details: "Mapping annotation to layout regions",
    });

    const ids = new Set(input.explicitIds);
    let confidence = input.explicitIds.length > 0 ? 0.9 : 0.4;

    if (!input.config.layoutRegionMatchingRulesEnabled) {
      return { layoutRegionIds: [...ids], confidence };
    }

    const tolerance = input.config.overlapTolerancePx;

    if (input.layoutUnderstanding) {
      try {
        const layout = input.layoutUnderstanding.getLatestLayout?.() ?? null;
        for (const region of layout?.regions ?? []) {
          const hit =
            (input.pointer && pointInBounds(input.pointer, region.bounds, tolerance)) ||
            (input.bounds && boundsOverlap(input.bounds, region.bounds, tolerance));
          if (hit) ids.add(region.regionId);
        }
        if (ids.size > 0) confidence = Math.max(confidence, 0.75);
      } catch {
        appendAnnotationLog({
          event: "layout_annotation_mapping",
          level: "warn",
          details: "Layout understanding data unavailable",
        });
      }
    }

    if (input.uiStateMapper && ids.size === 0) {
      try {
        const state = input.uiStateMapper.getLatestState?.() ?? null;
        for (const region of state?.screen.regions ?? []) {
          if (region.visibility === "hidden") continue;
          const hit =
            (input.pointer && pointInBounds(input.pointer, region.bounds, tolerance)) ||
            (input.bounds && boundsOverlap(input.bounds, region.bounds, tolerance));
          if (hit) ids.add(region.regionId);
        }
        if (ids.size > 0) confidence = Math.max(confidence, 0.7);
      } catch {
        /* ignore */
      }
    }

    return { layoutRegionIds: [...ids], confidence };
  }
}
