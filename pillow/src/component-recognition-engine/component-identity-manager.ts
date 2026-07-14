/** T1-03 — Stable component identity management. */

import { createHash } from "node:crypto";
import type { ComponentType } from "./types.js";

export function buildStableComponentId(
  sourceRegionId: string,
  contentSignature: string,
  componentType: ComponentType,
): string {
  const hash = createHash("sha256")
    .update(`${sourceRegionId}:${contentSignature}:${componentType}`)
    .digest("hex")
    .slice(0, 12);
  return `cmp-${hash}`;
}

export function buildRecognitionId(sessionId: string, sequence: number): string {
  return `${sessionId}-rec-${sequence}`;
}

export function buildComponentLabel(
  componentType: ComponentType,
  regionId: string,
): string | null {
  const shortId = regionId.split("-").pop() ?? regionId;
  return `${componentType.replace(/_/g, " ")} ${shortId}`;
}
