/**
 * G7-03 — Recovery integration.
 */

import type { AutomationOperation, RecoverySummary } from "../contracts/automation-operations-types.js";
import { transitionAutomationOperationStatus } from "./automation-lifecycle-manager.js";

export function integrateRecoveryOperations(operations: AutomationOperation[]): RecoverySummary {
  const recovering = operations.filter((op) => op.executionStatus === "recovering");
  const failed = operations.filter((op) => op.executionStatus === "failed");
  return {
    recoveringCount: recovering.length,
    failedCount: failed.length,
    operations: [...recovering, ...failed].map((op) => ({
      automationOperationId: op.automationOperationId,
      recoveryId: op.recoveryId,
      executionStatus: op.executionStatus,
    })),
  };
}

export function initiateAutomationRecovery(
  operation: AutomationOperation,
): { ok: true; operation: AutomationOperation } | { ok: false; reason: string } {
  return transitionAutomationOperationStatus(operation, "recovering", "pillow-recovery");
}
