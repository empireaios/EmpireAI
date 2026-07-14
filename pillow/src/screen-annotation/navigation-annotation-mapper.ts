/** T4-03 — Maps annotations to navigation node IDs from T1. */

import type { NavigationMappingEngine } from "../navigation-mapping-engine/engine.js";
import type { ScreenAnnotationConfiguration } from "./configuration.js";
import type { AnnotationType, PointerCoordinates, ScreenRegionBounds } from "./types.js";
import { appendAnnotationLog } from "./annotation-logging.js";

export class NavigationAnnotationMapper {
  map(input: {
    annotationType: AnnotationType;
    pointer: PointerCoordinates | null;
    bounds: ScreenRegionBounds | null;
    explicitIds: string[];
    componentIds: string[];
    config: ScreenAnnotationConfiguration;
    navigationMapping: NavigationMappingEngine | null;
  }): { navigationNodeIds: string[]; confidence: number } {
    appendAnnotationLog({
      event: "navigation_annotation_mapping",
      level: "info",
      details: "Mapping annotation to navigation nodes",
    });

    const ids = new Set(input.explicitIds);
    let confidence = input.explicitIds.length > 0 ? 0.9 : 0.35;

    if (!input.config.navigationMatchingRulesEnabled || !input.navigationMapping) {
      return { navigationNodeIds: [...ids], confidence };
    }

    try {
      const graph = input.navigationMapping.getLatestGraph?.() ?? null;
      for (const node of graph?.nodes ?? []) {
        if (node.visibility === "hidden") continue;
        const related = node.relatedComponentIds ?? [];
        const componentHit = related.some((id) => input.componentIds.includes(id));
        const navSelection = input.annotationType === "navigation_area_selection";
        if (componentHit || (navSelection && node.active)) {
          ids.add(node.nodeId);
        }
      }
      if (ids.size > 0) confidence = Math.max(confidence, 0.7);
    } catch {
      appendAnnotationLog({
        event: "navigation_annotation_mapping",
        level: "warn",
        details: "Navigation mapping data unavailable",
      });
    }

    return { navigationNodeIds: [...ids], confidence };
  }
}
