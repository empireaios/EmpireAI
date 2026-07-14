/** T1-02 — Machine-readable UI state model construction. */

import type { CaptureFrame } from "../visual-capture-engine/types.js";
import type { UiStateMapperConfiguration } from "./configuration.js";
import { computeRegionSignature, isEmptyOrLoadingFrame } from "./region-mapper.js";
import type { UiHierarchyNode, UiRegion, UiScreenState } from "./types.js";

export function buildScreenStateFromFrame(
  frame: CaptureFrame,
  config: UiStateMapperConfiguration,
): UiScreenState {
  const viewport = frame.metadata.viewport;
  const resolution = frame.metadata.resolution;
  const rows = Math.max(1, config.gridRows);
  const cols = Math.max(1, config.gridColumns);
  const totalRegions = rows * cols;
  const cellWidth = Math.max(1, Math.floor(viewport.width / cols));
  const cellHeight = Math.max(1, Math.floor(viewport.height / rows));

  const rootId = `screen-${frame.metadata.frameNumber}`;
  const regions: UiRegion[] = [];
  const hierarchy: UiHierarchyNode[] = [{ regionId: rootId, children: [] }];

  const isEmpty = isEmptyOrLoadingFrame(frame.byteLength, frame.imageBase64);

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const index = row * cols + col;
      const regionId = `${rootId}-r${row}c${col}`;
      const bounds = {
        x: col * cellWidth,
        y: row * cellHeight,
        width: col === cols - 1 ? viewport.width - col * cellWidth : cellWidth,
        height: row === rows - 1 ? viewport.height - row * cellHeight : cellHeight,
      };
      regions.push({
        regionId,
        parentRegionId: rootId,
        bounds,
        contentSignature: isEmpty
          ? "empty-screen"
          : computeRegionSignature(frame.imageBase64, index, totalRegions),
        visibility: isEmpty ? "hidden" : "visible",
      });
      hierarchy[0]!.children.push(regionId);
    }
  }

  return {
    screenId: rootId,
    dimensions: { width: resolution.width, height: resolution.height },
    viewport: { width: viewport.width, height: viewport.height },
    regions,
    hierarchy,
  };
}
