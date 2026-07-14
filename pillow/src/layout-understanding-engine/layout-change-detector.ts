/** T1-04 — Layout change detection between consecutive models. */

import type { LayoutChangeSummary, LayoutModel } from "./types.js";
import { ResponsiveLayoutDetector } from "./responsive-layout-detector.js";

const responsiveDetector = new ResponsiveLayoutDetector();

export function detectLayoutChanges(
  previous: LayoutModel | null,
  current: LayoutModel,
): LayoutChangeSummary {
  const viewport = current.metadata.viewport;
  const responsiveChanged = responsiveDetector.breakpointChanged(
    previous?.responsiveBreakpoints ?? null,
    current.responsiveBreakpoints,
  );

  if (!previous) {
    return {
      hasChanges: true,
      regionsAppeared: current.regions.map((r) => r.regionId),
      regionsDisappeared: [],
      regionsModified: [],
      responsiveChanged,
      previousViewport: null,
      currentViewport: viewport,
    };
  }

  const prevRegionIds = new Set(previous.regions.map((r) => r.regionId));
  const currRegionIds = new Set(current.regions.map((r) => r.regionId));

  const appeared = current.regions
    .filter((r) => !prevRegionIds.has(r.regionId))
    .map((r) => r.regionId);
  const disappeared = previous.regions
    .filter((r) => !currRegionIds.has(r.regionId))
    .map((r) => r.regionId);

  const modified: string[] = [];
  for (const region of current.regions) {
    const prev = previous.regions.find((r) => r.regionId === region.regionId);
    if (!prev) continue;
    if (
      prev.bounds.width !== region.bounds.width ||
      prev.bounds.height !== region.bounds.height ||
      prev.componentIds.length !== region.componentIds.length
    ) {
      modified.push(region.regionId);
    }
  }

  const viewportChanged =
    previous.metadata.viewport.width !== viewport.width ||
    previous.metadata.viewport.height !== viewport.height;

  return {
    hasChanges:
      appeared.length > 0 ||
      disappeared.length > 0 ||
      modified.length > 0 ||
      responsiveChanged ||
      viewportChanged,
    regionsAppeared: appeared,
    regionsDisappeared: disappeared,
    regionsModified: modified,
    responsiveChanged: responsiveChanged || viewportChanged,
    previousViewport: previous.metadata.viewport,
    currentViewport: viewport,
  };
}
