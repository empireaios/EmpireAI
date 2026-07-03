/**
 * G5-02 / G5-03 — Workflow Scheduler dispatch (canonical G5-03 intake).
 * Queues automation requests — does not execute workflows.
 */

import type { AutomationRequest } from "../contracts/trigger-types.js";
import { getWorkflowScheduler, resetWorkflowSchedulerForTests } from "./workflow-scheduler.js";
import { resetAutomationQueueForTests } from "../queue/automation-queue.js";
import { resetSchedulerAuditLogForTests } from "../audit/scheduler-audit-recorder.js";
import { resetSchedulerPluginRegistryForTests } from "./scheduler-plugin-registry.js";

export function dispatchToWorkflowScheduler(
  request: Omit<AutomationRequest, "requestId" | "createdAt" | "state" | "schedulerHandoff">,
  options?: {
    actorId: string;
    killSwitchActive?: boolean;
    scheduleRegistryId?: string;
    scheduleMode?: import("../contracts/scheduler-types.js").ScheduleMode;
    deferUntil?: string;
  },
): AutomationRequest {
  const actorId = options?.actorId ?? "system:trigger-engine";
  const { automationRequest } = getWorkflowScheduler().intakeFromTriggerRequest(request, {
    actorId,
    pillowGovernance: true,
    killSwitchActive: options?.killSwitchActive,
    scheduleRegistryId: options?.scheduleRegistryId,
    scheduleMode: options?.scheduleMode,
    deferUntil: options?.deferUntil,
  });
  return automationRequest;
}

export function peekSchedulerQueue(workspaceId?: string): readonly AutomationRequest[] {
  return getWorkflowScheduler().listIntakeBridge(workspaceId);
}

export function resetWorkflowSchedulerDispatchForTests(): void {
  resetWorkflowSchedulerForTests();
  resetAutomationQueueForTests();
  resetSchedulerAuditLogForTests();
  resetSchedulerPluginRegistryForTests();
}

export type { AutomationRequest };
