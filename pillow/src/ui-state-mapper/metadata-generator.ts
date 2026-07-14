/** T1-02 — UI state metadata generation. */

import { UI_STATE_MODEL_VERSION } from "./paths.js";
import type { MappingStatus } from "./types.js";

export function buildUiStateMetadata(input: {
  sessionId: string;
  sourceFrameId: string;
  stateId: string;
  screenResolution: { width: number; height: number };
  viewport: { width: number; height: number };
  processingDurationMs: number;
  mappingStatus: MappingStatus;
  error?: string;
}) {
  return {
    timestamp: new Date().toISOString(),
    sessionId: input.sessionId,
    sourceFrameId: input.sourceFrameId,
    stateId: input.stateId,
    version: UI_STATE_MODEL_VERSION,
    screenResolution: { ...input.screenResolution },
    viewport: { ...input.viewport },
    processingDurationMs: input.processingDurationMs,
    mappingStatus: input.mappingStatus,
    error: input.error,
  };
}

export function buildSourceFrameId(sessionId: string, frameNumber: number): string {
  return `${sessionId}-frame-${frameNumber}`;
}

export function buildStateId(sessionId: string, sequence: number): string {
  return `${sessionId}-state-${sequence}`;
}
