/**
 * G7-03 — Approval queue integration.
 */

import type { ApprovalQueueSummary, AutomationOperation } from "../contracts/automation-operations-types.js";

export function integrateApprovalQueue(operations: AutomationOperation[]): ApprovalQueueSummary {
  const pending = operations.filter((op) => op.executionStatus === "approval_pending");
  return {
    pendingCount: pending.length,
    operations: pending.map((op) => ({
      automationOperationId: op.automationOperationId,
      approvalId: op.approvalId,
      executionStatus: op.executionStatus,
    })),
  };
}

export function routeToApprovalQueue(operation: AutomationOperation): AutomationOperation {
  return {
    ...operation,
    executionStatus: "approval_pending",
    governanceState: "pillow-approval-pending",
  };
}
