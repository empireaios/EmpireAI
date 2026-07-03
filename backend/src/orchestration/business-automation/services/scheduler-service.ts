/**
 * G5-03 — Scheduler & Queue service (Brain tool handlers).
 */

import type { QueueSnapshot } from "../contracts/scheduler-types.js";
import type { ScheduleMode } from "../contracts/scheduler-types.js";
import { resolveSchedulePolicy } from "../scheduler/schedule-policy-resolver.js";
import { getAutomationQueue } from "../queue/automation-queue.js";
import { getWorkflowScheduler } from "../scheduler/workflow-scheduler.js";

export function getAutomationQueueSnapshot(workspaceId?: string): QueueSnapshot {
  return getAutomationQueue().snapshot(workspaceId);
}

export async function processSchedulerDueItems(input?: {
  nowIso?: string;
}): Promise<{ promotedCount: number; queueIds: string[] }> {
  const promoted = getWorkflowScheduler().processDue(input?.nowIso);
  return {
    promotedCount: promoted.length,
    queueIds: promoted.map((entry) => entry.queueId),
  };
}

export async function dispatchNextQueuedAutomation(input?: {
  nowIso?: string;
}): Promise<{ dispatched: boolean; queueId?: string; executionState?: string }> {
  const entry = getWorkflowScheduler().dispatchNextToOrchestrator(input?.nowIso);
  if (!entry) {
    return { dispatched: false };
  }
  return {
    dispatched: true,
    queueId: entry.queueId,
    executionState: entry.executionState,
  };
}

export async function scheduleAutomationRetry(input: {
  queueId: string;
  actorId: string;
  workspaceId: string;
  errorClass?: string;
  nowIso?: string;
}): Promise<{ queueId: string; executionState: string; retryCount: number }> {
  const entry = getWorkflowScheduler().scheduleRetry(input.queueId, input.actorId, {
    errorClass: input.errorClass,
    nowIso: input.nowIso,
  });
  return {
    queueId: entry.queueId,
    executionState: entry.executionState,
    retryCount: entry.retryCount,
  };
}

export async function cancelScheduledAutomation(input: {
  queueId: string;
  actorId: string;
  workspaceId: string;
}): Promise<{ queueId: string; executionState: string }> {
  const entry = getWorkflowScheduler().cancelWithAudit(input.queueId, input.actorId);
  return {
    queueId: entry.queueId,
    executionState: entry.executionState,
  };
}

export async function scheduleAutomationRecovery(input: {
  queueId: string;
  recoveryRegistryId: string;
  actorId: string;
  workspaceId: string;
  nowIso?: string;
}): Promise<{ queueId: string; executionState: string }> {
  const entry = getWorkflowScheduler().scheduleRecovery(
    input.queueId,
    input.recoveryRegistryId,
    input.actorId,
    input.nowIso,
  );
  return {
    queueId: entry.queueId,
    executionState: entry.executionState,
  };
}

export function resolveSchedulePolicyPreview(input: {
  scheduleRegistryId?: string;
  policyRegistryId?: string;
  recoveryRegistryId?: string;
  scheduleMode?: ScheduleMode;
}) {
  return resolveSchedulePolicy(input);
}
