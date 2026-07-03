/**
 * G5-02 — EKLS trigger audit recorder (Pillow-governed).
 * Full EKLS persistence deferred to G5-08 — events validated through governance gateway.
 */

import { enforceEklsAccess } from "../../pillow/ekls/services/ekls-governance-gateway.js";
import type { TriggerApprovalState, TriggerCategory } from "../contracts/trigger-types.js";

export type TriggerAuditEventType =
  | "trigger_received"
  | "trigger_accepted"
  | "trigger_rejected"
  | "approval_required"
  | "decision_reference";

export type TriggerAuditEvent = {
  eventId: string;
  eventType: TriggerAuditEventType;
  workspaceId: string;
  actorId: string;
  triggerId: string;
  category: TriggerCategory;
  correlationId: string;
  decisionReference?: string;
  approvalState?: TriggerApprovalState;
  reason: string;
  pillowGovernance: true;
  recordedAt: string;
};

let auditSequence = 0;

const triggerAuditLog: TriggerAuditEvent[] = [];

export function recordTriggerAuditEvent(input: {
  eventType: TriggerAuditEventType;
  workspaceId: string;
  actorId: string;
  triggerId: string;
  category: TriggerCategory;
  correlationId: string;
  decisionReference?: string;
  approvalState?: TriggerApprovalState;
  reason: string;
}): TriggerAuditEvent {
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
    throw new Error(`EKLS trigger audit rejected: ${ekls.reason}`);
  }

  auditSequence += 1;
  const event: TriggerAuditEvent = {
    eventId: `trigger-audit:${auditSequence}`,
    eventType: input.eventType,
    workspaceId: input.workspaceId,
    actorId: input.actorId,
    triggerId: input.triggerId,
    category: input.category,
    correlationId: input.correlationId,
    decisionReference: input.decisionReference,
    approvalState: input.approvalState,
    reason: input.reason,
    pillowGovernance: true,
    recordedAt: new Date().toISOString(),
  };
  triggerAuditLog.push(event);
  return event;
}

export function listTriggerAuditEvents(workspaceId?: string): readonly TriggerAuditEvent[] {
  if (!workspaceId) return [...triggerAuditLog];
  return triggerAuditLog.filter((event) => event.workspaceId === workspaceId);
}

export function resetTriggerAuditLogForTests(): void {
  triggerAuditLog.length = 0;
  auditSequence = 0;
}
