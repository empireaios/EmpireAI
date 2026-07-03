/**
 * G7-03 — Cockpit Grand King business automation operations backend contracts.
 */

import type {
  ActiveExecutionSummary,
  ApprovalQueueSummary,
  AutomationOperationDependencySummary,
  AutomationOperationHealthSummary,
  AutomationOperationsOverview,
  RecoverySummary,
  WorkflowQueueSummary,
} from "./automation-operations-types.js";

export const COCKPIT_AUTOMATION_OPERATIONS_VIEW_ID = "cockpit-grand-king-business-automation-operations" as const;

export type CockpitAutomationOperationsView = {
  viewId: typeof COCKPIT_AUTOMATION_OPERATIONS_VIEW_ID;
  computedAt: string;
  dataMode: "live";
  automationOperations: AutomationOperationsOverview;
  workflowQueue: WorkflowQueueSummary;
  activeExecutions: ActiveExecutionSummary;
  approvals: ApprovalQueueSummary;
  recoveries: RecoverySummary;
  automationHealth: AutomationOperationHealthSummary;
  dependencies: AutomationOperationDependencySummary;
  executiveSummary: string;
  discoverySource: "grand-king-business-automation-operations:cockpit";
};

export function buildCockpitAutomationOperationsView(input: {
  overview: AutomationOperationsOverview;
  workflowQueue: WorkflowQueueSummary;
  activeExecutions: ActiveExecutionSummary;
  approvals: ApprovalQueueSummary;
  recoveries: RecoverySummary;
  automationHealth: AutomationOperationHealthSummary;
  dependencies: AutomationOperationDependencySummary;
  executiveSummary: string;
}): CockpitAutomationOperationsView {
  return {
    viewId: COCKPIT_AUTOMATION_OPERATIONS_VIEW_ID,
    computedAt: new Date().toISOString(),
    dataMode: "live",
    automationOperations: input.overview,
    workflowQueue: input.workflowQueue,
    activeExecutions: input.activeExecutions,
    approvals: input.approvals,
    recoveries: input.recoveries,
    automationHealth: input.automationHealth,
    dependencies: input.dependencies,
    executiveSummary: input.executiveSummary,
    discoverySource: "grand-king-business-automation-operations:cockpit",
  };
}
