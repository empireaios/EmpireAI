/**
 * G7-03 — Workflow execution monitor.
 */

import type { AutomationOperation } from "../contracts/automation-operations-types.js";
import type { ActiveExecutionSummary } from "../contracts/automation-operations-types.js";

export function monitorWorkflowExecutions(operations: AutomationOperation[]): ActiveExecutionSummary {
  const executing = operations.filter((op) => op.executionStatus === "executing");
  return {
    executingCount: executing.length,
    operations: executing.map((op) => ({
      automationOperationId: op.automationOperationId,
      workflowRunId: op.workflowRunId,
      executionStatus: op.executionStatus,
    })),
  };
}

export function isWorkflowExecutionStalled(operation: AutomationOperation, thresholdMs = 600_000): boolean {
  if (operation.executionStatus !== "executing") return false;
  const elapsed = Date.now() - new Date(operation.startedAt).getTime();
  return elapsed > thresholdMs;
}
