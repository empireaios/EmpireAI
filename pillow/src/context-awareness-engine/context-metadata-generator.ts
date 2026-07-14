/** T1-07 — Workflow context metadata generation. */

import { WORKFLOW_CONTEXT_VERSION } from "./paths.js";

export function buildContextId(sessionId: string, sequence: number): string {
  return `wf-ctx-${sessionId}-${sequence}`;
}

export function buildContextMetadata(input: {
  contextId: string;
  sessionId: string;
  processingDurationMs: number;
  confidenceScore: number;
}) {
  return {
    contextId: input.contextId,
    sessionId: input.sessionId,
    timestamp: new Date().toISOString(),
    processingDurationMs: input.processingDurationMs,
    confidenceScore: Math.round(input.confidenceScore * 100) / 100,
    metadataVersion: WORKFLOW_CONTEXT_VERSION,
  };
}
