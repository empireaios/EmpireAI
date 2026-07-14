/** T1-01 — Frame metadata generation. */

import type { CaptureFrameMetadata, CaptureSource, CaptureStatus } from "./types.js";

export function buildCaptureFrameMetadata(input: {
  sessionId: string;
  frameNumber: number;
  windowId: string;
  displayId: string;
  viewport: { width: number; height: number };
  resolution: { width: number; height: number };
  captureDurationMs: number;
  captureStatus: CaptureStatus;
  captureSource: CaptureSource;
  error?: string;
}): CaptureFrameMetadata {
  return {
    timestamp: new Date().toISOString(),
    sessionId: input.sessionId,
    frameNumber: input.frameNumber,
    windowId: input.windowId,
    displayId: input.displayId,
    resolution: { ...input.resolution },
    viewport: { ...input.viewport },
    captureDurationMs: input.captureDurationMs,
    captureStatus: input.captureStatus,
    captureSource: input.captureSource,
    error: input.error,
  };
}
