/**
 * G7-00 — Live operation state engine.
 */

import type { LiveOperation, LiveOperationState } from "../contracts/live-operations-types.js";
import { isValidLiveOperationTransition } from "../contracts/live-operations-types.js";

export function transitionLiveOperationState(
  operation: LiveOperation,
  targetStatus: LiveOperationState,
  governanceState: string,
): { ok: true; operation: LiveOperation } | { ok: false; reason: string } {
  if (!isValidLiveOperationTransition(operation.status, targetStatus)) {
    return {
      ok: false,
      reason: `Invalid transition from ${operation.status} to ${targetStatus}`,
    };
  }

  const now = new Date().toISOString();
  return {
    ok: true,
    operation: {
      ...operation,
      status: targetStatus,
      updatedAt: now,
      governanceState,
      startedAt: targetStatus === "active" && operation.status !== "active" ? now : operation.startedAt,
    },
  };
}
