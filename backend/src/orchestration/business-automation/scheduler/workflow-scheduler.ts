/**
 * G5-03 — Canonical Workflow Scheduler (timing only — no workflow execution).
 */

import { randomUUID } from "node:crypto";
import type { AutomationRequest } from "../contracts/trigger-types.js";
import type {
  QueuedAutomationRequest,
  QueueExecutionState,
  SchedulerIntakeOptions,
} from "../contracts/scheduler-types.js";
import { recordSchedulerAuditEvent } from "../audit/scheduler-audit-recorder.js";
import {
  validateQueueMutation,
  validateSchedulerIntakeRequest,
} from "../governance/scheduler-pillow-governance.js";
import { getAutomationQueue } from "../queue/automation-queue.js";
import {
  computeExecutionDeadline,
  computeScheduledTime,
  resolveSchedulePolicy,
} from "./schedule-policy-resolver.js";
import { schedulerPluginRegistry } from "./scheduler-plugin-registry.js";

const intakeBridge: AutomationRequest[] = [];

function resolveInitialState(scheduledTime: string, nowIso: string): QueueExecutionState {
  return Date.parse(scheduledTime) <= Date.parse(nowIso) ? "queued" : "scheduled";
}

function buildApprovalReference(request: AutomationRequest): string | undefined {
  if (request.approvalRouting.approvalState === "not_required") return undefined;
  return `${request.approvalRouting.approvalState}:${request.registryRefs.approvalId ?? "unbound"}`;
}

export class WorkflowScheduler {
  private readonly queue = getAutomationQueue();

  intakeFromTriggerRequest(
    request: Omit<AutomationRequest, "requestId" | "createdAt" | "state" | "schedulerHandoff">,
    options: SchedulerIntakeOptions,
  ): { automationRequest: AutomationRequest; queueEntry: QueuedAutomationRequest } {
    const governance = validateSchedulerIntakeRequest(request, {
      pillowGovernance: true,
      actorId: options.actorId,
      workspaceId: request.triggerContext.workspaceId,
      companyId: request.triggerContext.companyId,
      killSwitchActive: options.killSwitchActive,
    });
    if (!governance.eligible) {
      throw new Error(`Scheduler intake rejected: ${governance.reason}`);
    }

    const policy = resolveSchedulePolicy({
      scheduleRegistryId: options.scheduleRegistryId,
      policyRegistryId: request.registryRefs.policyId,
      scheduleMode: options.scheduleMode ?? "immediate",
    });

    const plugin = schedulerPluginRegistry.resolveSchedulerPlugin(policy.scheduleMode);
    const nowMs = Date.now();
    const pluginTime = plugin?.computeScheduledTime?.({ policy, nowMs });
    const scheduledTime =
      pluginTime ??
      computeScheduledTime({
        policy,
        nowMs,
        deferUntil: options.deferUntil,
      });

    const executionDeadline = computeExecutionDeadline(scheduledTime, policy);
    const nowIso = new Date(nowMs).toISOString();
    const initialState = resolveInitialState(scheduledTime, nowIso);
    const queueId = randomUUID();
    const requestId = randomUUID();

    const queueEntry: QueuedAutomationRequest = {
      queueId,
      workflowId: request.workflowRef.id,
      workflowVersion: request.workflowRef.version,
      triggerId: request.triggerContext.triggerId,
      workspaceId: request.triggerContext.workspaceId,
      companyId: request.triggerContext.companyId,
      brandId: request.triggerContext.brandId,
      priority: request.triggerContext.priority,
      executionState: initialState === "queued" ? "queued" : "pending",
      correlationId: request.correlationId,
      decisionReference: request.triggerContext.decisionReference,
      approvalReference: buildApprovalReference(request as AutomationRequest),
      registryReferences: request.registryRefs,
      createdAt: nowIso,
      scheduledTime,
      executionDeadline,
      retryCount: 0,
      scheduleMode: policy.scheduleMode,
      scheduleRegistryId: policy.scheduleRegistryId,
      policyRegistryId: policy.policyRegistryId,
      recoveryRegistryId: policy.recoveryRegistryId,
      sourceRequestId: requestId,
      pillowGovernance: true,
      orchestratorHandoffReady: initialState === "queued",
    };

    if (initialState === "scheduled") {
      queueEntry.executionState = "scheduled";
    }

    this.queue.enqueue(queueEntry);

    recordSchedulerAuditEvent({
      eventType: "workflow_scheduled",
      workspaceId: queueEntry.workspaceId,
      actorId: options.actorId,
      queueId: queueEntry.queueId,
      workflowId: queueEntry.workflowId,
      triggerId: queueEntry.triggerId,
      correlationId: queueEntry.correlationId,
      executionState: queueEntry.executionState,
      reason: `Workflow scheduled via registry policy (${policy.scheduleMode})`,
    });

    if (queueEntry.executionState === "queued") {
      recordSchedulerAuditEvent({
        eventType: "workflow_queued",
        workspaceId: queueEntry.workspaceId,
        actorId: options.actorId,
        queueId: queueEntry.queueId,
        workflowId: queueEntry.workflowId,
        triggerId: queueEntry.triggerId,
        correlationId: queueEntry.correlationId,
        executionState: "queued",
        reason: "Immediate schedule — queued for orchestrator dispatch",
      });
    }

    const automationRequest: AutomationRequest = {
      ...request,
      requestId,
      state: "QUEUED_FOR_SCHEDULER",
      schedulerHandoff: true,
      createdAt: nowIso,
      queueId,
    };

    intakeBridge.push(automationRequest);
    return { automationRequest, queueEntry };
  }

  processDue(nowIso: string = new Date().toISOString()): QueuedAutomationRequest[] {
    const due = this.queue.listDue(nowIso, "scheduled");
    const promoted: QueuedAutomationRequest[] = [];

    for (const entry of due) {
      entry.executionState = "queued";
      entry.orchestratorHandoffReady = true;
      promoted.push(entry);
      recordSchedulerAuditEvent({
        eventType: "workflow_queued",
        workspaceId: entry.workspaceId,
        actorId: "system:scheduler",
        queueId: entry.queueId,
        workflowId: entry.workflowId,
        triggerId: entry.triggerId,
        correlationId: entry.correlationId,
        executionState: "queued",
        reason: "Scheduled time reached — promoted to queue",
      });
    }

    return promoted;
  }

  scheduleRetry(
    queueId: string,
    actorId: string,
    input?: { errorClass?: string; nowIso?: string },
  ): QueuedAutomationRequest {
    const entry = this.queue.getById(queueId);
    if (!entry) throw new Error(`Queue entry not found: ${queueId}`);

    const governance = validateQueueMutation(entry, {
      pillowGovernance: true,
      actorId,
      workspaceId: entry.workspaceId,
      companyId: entry.companyId,
    });
    if (!governance.eligible) {
      throw new Error(`Retry scheduling rejected: ${governance.reason}`);
    }

    const policy = resolveSchedulePolicy({
      scheduleRegistryId: entry.scheduleRegistryId,
      policyRegistryId: entry.policyRegistryId,
      recoveryRegistryId: entry.recoveryRegistryId,
      scheduleMode: "retry",
    });

    const nextRetryCount = entry.retryCount + 1;
    if (
      !schedulerPluginRegistry.applyRetryStrategy({
        policy,
        retryCount: nextRetryCount,
        errorClass: input?.errorClass,
      })
    ) {
      entry.executionState = "failed";
      throw new Error(`Retry limit reached (${policy.maxAttempts})`);
    }

    const delayOverride = schedulerPluginRegistry.applyDelayStrategy(policy, nextRetryCount);
    const nowMs = Date.parse(input?.nowIso ?? new Date().toISOString());
    const scheduledTime =
      delayOverride !== undefined
        ? new Date(nowMs + delayOverride).toISOString()
        : computeScheduledTime({ policy, nowMs, retryCount: nextRetryCount });

    entry.retryCount = nextRetryCount;
    entry.scheduledTime = scheduledTime;
    entry.executionDeadline = computeExecutionDeadline(scheduledTime, policy);
    entry.scheduleMode = "retry";
    entry.executionState = "retrying";
    entry.orchestratorHandoffReady = false;

    recordSchedulerAuditEvent({
      eventType: "workflow_retried",
      workspaceId: entry.workspaceId,
      actorId,
      queueId: entry.queueId,
      workflowId: entry.workflowId,
      triggerId: entry.triggerId,
      correlationId: entry.correlationId,
      executionState: "retrying",
      reason: `Retry ${nextRetryCount} scheduled via registry backoff`,
    });

    entry.executionState = "scheduled";
    recordSchedulerAuditEvent({
      eventType: "workflow_delayed",
      workspaceId: entry.workspaceId,
      actorId,
      queueId: entry.queueId,
      workflowId: entry.workflowId,
      triggerId: entry.triggerId,
      correlationId: entry.correlationId,
      executionState: "scheduled",
      reason: "Retry deferred until registry-computed scheduled time",
    });

    return entry;
  }

  scheduleRecovery(
    queueId: string,
    recoveryRegistryId: string,
    actorId: string,
    nowIso?: string,
  ): QueuedAutomationRequest {
    const entry = this.queue.getById(queueId);
    if (!entry) throw new Error(`Queue entry not found: ${queueId}`);

    const governance = validateQueueMutation(entry, {
      pillowGovernance: true,
      actorId,
      workspaceId: entry.workspaceId,
      companyId: entry.companyId,
    });
    if (!governance.eligible) {
      throw new Error(`Recovery scheduling rejected: ${governance.reason}`);
    }

    const policy = resolveSchedulePolicy({
      scheduleRegistryId: entry.scheduleRegistryId,
      policyRegistryId: entry.policyRegistryId,
      recoveryRegistryId,
      scheduleMode: "recovery",
    });

    const nowMs = Date.parse(nowIso ?? new Date().toISOString());
    entry.recoveryRegistryId = recoveryRegistryId;
    entry.scheduleMode = "recovery";
    entry.scheduledTime = computeScheduledTime({ policy, nowMs, retryCount: entry.retryCount });
    entry.executionDeadline = computeExecutionDeadline(entry.scheduledTime, policy);
    entry.executionState = "recovered";
    entry.orchestratorHandoffReady = false;

    recordSchedulerAuditEvent({
      eventType: "workflow_delayed",
      workspaceId: entry.workspaceId,
      actorId,
      queueId: entry.queueId,
      workflowId: entry.workflowId,
      triggerId: entry.triggerId,
      correlationId: entry.correlationId,
      executionState: "recovered",
      reason: `Recovery scheduled via ${recoveryRegistryId}`,
    });

    entry.executionState = "scheduled";
    return entry;
  }

  cancel(queueId: string, actorId: string): QueuedAutomationRequest {
    const entry = this.queue.getById(queueId);
    if (!entry) throw new Error(`Queue entry not found: ${queueId}`);

    const governance = validateQueueMutation(entry, {
      pillowGovernance: true,
      actorId,
      workspaceId: entry.workspaceId,
      companyId: entry.companyId,
    });
    if (!governance.eligible) {
      throw new Error(`Cancel rejected: ${governance.reason}`);
    }

    return this.queue.updateState(queueId, "cancelled");
  }

  dispatchNextToOrchestrator(nowIso: string = new Date().toISOString()): QueuedAutomationRequest | undefined {
    const ready = this.queue.dequeueReadyForOrchestrator(nowIso);
    if (!ready) return undefined;

    ready.executionState = "waiting";
    recordSchedulerAuditEvent({
      eventType: "workflow_queued",
      workspaceId: ready.workspaceId,
      actorId: "system:scheduler",
      queueId: ready.queueId,
      workflowId: ready.workflowId,
      triggerId: ready.triggerId,
      correlationId: ready.correlationId,
      executionState: "waiting",
      reason: "Queue dispatch — waiting for G5-04 orchestrator pickup (no execution in G5-03)",
    });

    return ready;
  }

  markCompleted(queueId: string, actorId: string): QueuedAutomationRequest {
    const entry = this.queue.getById(queueId);
    if (!entry) throw new Error(`Queue entry not found: ${queueId}`);

    const updated = this.queue.updateState(queueId, "completed");
    recordSchedulerAuditEvent({
      eventType: "workflow_completed",
      workspaceId: entry.workspaceId,
      actorId,
      queueId: entry.queueId,
      workflowId: entry.workflowId,
      triggerId: entry.triggerId,
      correlationId: entry.correlationId,
      executionState: "completed",
      reason: "Workflow marked completed (scheduler state only)",
    });
    return updated;
  }

  cancelWithAudit(queueId: string, actorId: string): QueuedAutomationRequest {
    const updated = this.cancel(queueId, actorId);
    recordSchedulerAuditEvent({
      eventType: "workflow_cancelled",
      workspaceId: updated.workspaceId,
      actorId,
      queueId: updated.queueId,
      workflowId: updated.workflowId,
      triggerId: updated.triggerId,
      correlationId: updated.correlationId,
      executionState: "cancelled",
      reason: "Workflow cancelled via scheduler governance",
    });
    return updated;
  }

  listIntakeBridge(workspaceId?: string): readonly AutomationRequest[] {
    if (!workspaceId) return [...intakeBridge];
    return intakeBridge.filter((item) => item.triggerContext.workspaceId === workspaceId);
  }

  resetForTests(): void {
    intakeBridge.length = 0;
    this.queue.resetForTests();
  }
}

let sharedScheduler: WorkflowScheduler | undefined;

export function getWorkflowScheduler(): WorkflowScheduler {
  if (!sharedScheduler) {
    sharedScheduler = new WorkflowScheduler();
  }
  return sharedScheduler;
}

export function resetWorkflowSchedulerForTests(): void {
  sharedScheduler = undefined;
  intakeBridge.length = 0;
}
