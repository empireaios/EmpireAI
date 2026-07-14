/** T1-03 — Component recognition metadata generation. */

import { COMPONENT_MODEL_VERSION } from "./paths.js";
import type { RecognitionStatus } from "./types.js";

export function buildRecognitionMetadata(input: {
  sessionId: string;
  sourceStateId: string;
  recognitionId: string;
  viewport: { width: number; height: number };
  processingDurationMs: number;
  recognitionStatus: RecognitionStatus;
  totalComponents: number;
  error?: string;
}) {
  return {
    timestamp: new Date().toISOString(),
    sessionId: input.sessionId,
    sourceStateId: input.sourceStateId,
    recognitionId: input.recognitionId,
    version: COMPONENT_MODEL_VERSION,
    viewport: { ...input.viewport },
    processingDurationMs: input.processingDurationMs,
    recognitionStatus: input.recognitionStatus,
    totalComponents: input.totalComponents,
    error: input.error,
  };
}
