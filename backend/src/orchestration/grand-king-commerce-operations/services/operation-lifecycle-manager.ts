/**
 * G7-02 — Commerce operation lifecycle manager.
 */

import type { CommerceOperation, CommerceOperationState } from "../contracts/commerce-operations-types.js";
import { isValidCommerceOperationTransition } from "../contracts/commerce-operations-types.js";

export function transitionCommerceOperationStatus(
  operation: CommerceOperation,
  targetStatus: CommerceOperationState,
  governanceState: string,
): { ok: true; operation: CommerceOperation } | { ok: false; reason: string } {
  if (!isValidCommerceOperationTransition(operation.status, targetStatus)) {
    return {
      ok: false,
      reason: `Invalid commerce operation transition from ${operation.status} to ${targetStatus}`,
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
      startedAt: targetStatus === "running" && operation.status !== "running" ? now : operation.startedAt,
    },
  };
}
