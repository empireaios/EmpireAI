/** T4-03 — Maps pointer/bounds to screen coordinates and T1 UI context. */

import type { UiStateMapperEngine } from "../ui-state-mapper/engine.js";
import type { ScreenAnnotationConfiguration } from "./configuration.js";
import type { PointerCoordinates, ScreenRegionBounds } from "./types.js";
import { appendAnnotationLog } from "./annotation-logging.js";

export type ScreenCoordinateMapping = {
  currentScreenId: string | null;
  currentRouteOrViewId: string | null;
  viewport: { width: number; height: number } | null;
  normalizedPointer: PointerCoordinates | null;
  normalizedBounds: ScreenRegionBounds | null;
  confidence: number;
};

export class ScreenCoordinateMapper {
  map(input: {
    pointer: PointerCoordinates | null;
    bounds: ScreenRegionBounds | null;
    config: ScreenAnnotationConfiguration;
    uiStateMapper: UiStateMapperEngine | null;
  }): ScreenCoordinateMapping {
    appendAnnotationLog({
      event: "coordinate_mapping",
      level: "info",
      details: "Mapping annotation coordinates to screen context",
    });

    let currentScreenId: string | null = null;
    let currentRouteOrViewId: string | null = null;
    let viewport: { width: number; height: number } | null = null;
    let confidence = 0.5;

    if (input.config.coordinateMappingRulesEnabled && input.uiStateMapper) {
      try {
        const state = input.uiStateMapper.getLatestState?.() ?? null;
        if (state?.screen) {
          currentScreenId = state.screen.screenId ?? null;
          currentRouteOrViewId = state.metadata?.sessionId
            ? `session:${state.metadata.sessionId}`
            : currentScreenId;
          viewport = state.screen.viewport ?? state.screen.dimensions ?? null;
          confidence = 0.85;
        }
      } catch {
        appendAnnotationLog({
          event: "coordinate_mapping",
          level: "warn",
          details: "UI context unavailable for coordinate mapping",
        });
      }
    }

    let normalizedPointer = input.pointer;
    let normalizedBounds = input.bounds;

    if (viewport && normalizedBounds) {
      normalizedBounds = {
        x: Math.min(normalizedBounds.x, viewport.width),
        y: Math.min(normalizedBounds.y, viewport.height),
        width: Math.min(normalizedBounds.width, viewport.width - normalizedBounds.x),
        height: Math.min(normalizedBounds.height, viewport.height - normalizedBounds.y),
      };
    }

    if (!currentScreenId) confidence = Math.min(confidence, 0.45);

    return {
      currentScreenId,
      currentRouteOrViewId,
      viewport,
      normalizedPointer,
      normalizedBounds,
      confidence,
    };
  }
}

function pointInBounds(
  point: PointerCoordinates,
  bounds: { x: number; y: number; width: number; height: number },
  tolerance: number,
): boolean {
  return (
    point.x >= bounds.x - tolerance &&
    point.x <= bounds.x + bounds.width + tolerance &&
    point.y >= bounds.y - tolerance &&
    point.y <= bounds.y + bounds.height + tolerance
  );
}

function boundsOverlap(
  a: ScreenRegionBounds,
  b: { x: number; y: number; width: number; height: number },
  tolerance: number,
): boolean {
  return !(
    a.x + a.width < b.x - tolerance ||
    b.x + b.width < a.x - tolerance ||
    a.y + a.height < b.y - tolerance ||
    b.y + b.height < a.y - tolerance
  );
}

export { pointInBounds, boundsOverlap };
