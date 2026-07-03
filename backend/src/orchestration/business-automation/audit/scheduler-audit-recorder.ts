/**
 * G5-03 — EKLS scheduler audit recorder (Pillow-governed).
 */

import { enforceEklsAccess } from "../../pillow/ekls/services/ekls-governance-gateway.js";
import type { QueueExecutionState } from "../contracts/scheduler-types.js";

export type SchedulerAuditEventType =
  | "workflow_scheduled"
  | "workflow_queued"
  | "workflow_delayed"
  | "workflow_retried"
  | "workflow_cancelled"
  | "workflow_completed";

export type SchedulerAuditEvent = {
  eventId: string;
  eventType: SchedulerAuditEventType;
  workspaceId: string;
  actorId: string;
  queueId: string;
  workflowId: string;
  triggerId: string;
  correlationId: string;
  executionState: QueueExecutionState;
  reason: string;
  pillowGovernance: true;
  recordedAt: string;
};

let auditSequence = 0;
const schedulerAuditLog: SchedulerAuditEvent[] = [];

export function recordSchedulerAuditEvent(input: {
  eventType: SchedulerAuditEventType;
  workspaceId: string;
  actorId: string;
  queueId: string;
  workflowId: string;
  triggerId: string;
  correlationId: string;
  executionState: QueueExecutionState;
  reason: string;
}): SchedulerAuditEvent {
  const ekls = enforceEklsAccess(
    {
      pillowGovernance: true,
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      consumerChannel: "business-automation",
      operation: "store",
    },
    input.workspaceId,
  );

  if (!ekls.allowed) {
    throw new Error(`EKLS scheduler audit rejected: ${ekls.reason}`);
  }

  auditSequence += 1;
  const event: SchedulerAuditEvent = {
    eventId: `scheduler-audit:${auditSequence}`,
    eventType: input.eventType,
    workspaceId: input.workspaceId,
    actorId: input.actorId,
    queueId: input.queueId,
    workflowId: input.workflowId,
    triggerId: input.triggerId,
    correlationId: input.correlationId,
    executionState: input.executionState,
    reason: input.reason,
    pillowGovernance: true,
    recordedAt: new Date().toISOString(),
  };
  schedulerAuditLog.push(event);
  return event;
}

export function listSchedulerAuditEvents(workspaceId?: string): readonly SchedulerAuditEvent[] {
  if (!workspaceId) return [...schedulerAuditLog];
  return schedulerAuditLog.filter((event) => event.workspaceId === workspaceId);
}

export function resetSchedulerAuditLogForTests(): void {
  schedulerAuditLog.length = 0;
  auditSequence = 0;
}
