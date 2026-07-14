/** T4-03 — Maps annotations to component IDs from T1 component recognition. */

import type { ComponentRecognitionEngine } from "../component-recognition-engine/engine.js";
import type { ScreenAnnotationConfiguration } from "./configuration.js";
import type { PointerCoordinates, ScreenRegionBounds } from "./types.js";
import { boundsOverlap, pointInBounds } from "./screen-coordinate-mapper.js";
import { appendAnnotationLog } from "./annotation-logging.js";

export class ComponentAnnotationMapper {
  map(input: {
    pointer: PointerCoordinates | null;
    bounds: ScreenRegionBounds | null;
    explicitIds: string[];
    config: ScreenAnnotationConfiguration;
    componentRecognition: ComponentRecognitionEngine | null;
  }): { componentIds: string[]; confidence: number } {
    appendAnnotationLog({
      event: "component_annotation_mapping",
      level: "info",
      details: "Mapping annotation to components",
    });

    const ids = new Set(input.explicitIds);
    let confidence = input.explicitIds.length > 0 ? 0.9 : 0.4;

    if (!input.config.componentMatchingRulesEnabled || !input.componentRecognition) {
      return { componentIds: [...ids], confidence };
    }

    try {
      const result = input.componentRecognition.getLatestResult?.() ?? null;
      const components = result?.components ?? [];
      const tolerance = input.config.overlapTolerancePx;

      for (const component of components) {
        if (component.visibility === "hidden") continue;
        const cb = component.bounds;
        const hit =
          (input.pointer && pointInBounds(input.pointer, cb, tolerance)) ||
          (input.bounds && boundsOverlap(input.bounds, cb, tolerance));
        if (hit) ids.add(component.componentId);
      }

      if (ids.size > 0) confidence = Math.max(confidence, 0.75);
      if (ids.size > 1) confidence = Math.min(confidence, 0.65);
    } catch {
      appendAnnotationLog({
        event: "component_annotation_mapping",
        level: "warn",
        details: "Component recognition data unavailable",
      });
    }

    return { componentIds: [...ids], confidence };
  }
}
