/**
 * G7-03 — Automation lifecycle manager.
 */

import type { AutomationOperation, AutomationOperationState } from "../contracts/automation-operations-types.js";
import { isValidAutomationOperationTransition } from "../contracts/automation-operations-types.js";

export function transitionAutomationOperationStatus(
  operation: AutomationOperation,
  targetStatus: AutomationOperationState,
  governanceState: string,
): { ok: true; operation: AutomationOperation } | { ok: false; reason: string } {
  if (!isValidAutomationOperationTransition(operation.executionStatus, targetStatus)) {
    return {
      ok: false,
      reason: `Invalid automation transition from ${operation.executionStatus} to ${targetStatus}`,
    };
  }

  const now = new Date().toISOString();
  return {
    ok: true,
    operation: {
      ...operation,
      executionStatus: targetStatus,
      governanceState,
      startedAt: targetStatus === "executing" && operation.executionStatus !== "executing" ? now : operation.startedAt,
      completedAt:
        targetStatus === "completed" || targetStatus === "cancelled" || targetStatus === "failed"
          ? now
          : operation.completedAt,
    },
  };
}
