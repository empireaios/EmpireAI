/**
 * G7-03 — Production scheduler integration.
 */

import type { AutomationOperation, WorkflowQueueSummary } from "../contracts/automation-operations-types.js";

export function integrateProductionScheduler(operations: AutomationOperation[]): WorkflowQueueSummary {
  const waiting = operations.filter((op) => op.executionStatus === "waiting");
  const scheduled = operations.filter((op) => op.executionStatus === "scheduled");
  return {
    queueDepth: waiting.length + scheduled.length,
    waitingCount: waiting.length,
    scheduledCount: scheduled.length,
    operations: [...waiting, ...scheduled].map((op) => ({
      automationOperationId: op.automationOperationId,
      domainId: op.domainId,
      executionStatus: op.executionStatus,
    })),
  };
}

export function scheduleAutomationOperation(operation: AutomationOperation): AutomationOperation {
  return {
    ...operation,
    executionStatus: "scheduled",
    queueId: operation.queueId,
  };
}
