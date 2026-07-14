/** T1-04 — Layout metadata generation. */

import { LAYOUT_MODEL_VERSION } from "./paths.js";
import type { LayoutStatus } from "./types.js";

export function buildLayoutMetadata(input: {
  sessionId: string;
  sourceStateId: string;
  sourceComponentSetId: string;
  layoutId: string;
  screenId: string | null;
  viewport: { width: number; height: number };
  processingDurationMs: number;
  layoutStatus: LayoutStatus;
  confidenceScore: number;
  error?: string;
}) {
  return {
    timestamp: new Date().toISOString(),
    sessionId: input.sessionId,
    sourceStateId: input.sourceStateId,
    sourceComponentSetId: input.sourceComponentSetId,
    layoutId: input.layoutId,
    version: LAYOUT_MODEL_VERSION,
    screenId: input.screenId,
    viewport: { ...input.viewport },
    processingDurationMs: input.processingDurationMs,
    layoutStatus: input.layoutStatus,
    confidenceScore: input.confidenceScore,
    error: input.error,
  };
}

export function buildLayoutId(sessionId: string, sequence: number): string {
  return `${sessionId}-layout-${sequence}`;
}
