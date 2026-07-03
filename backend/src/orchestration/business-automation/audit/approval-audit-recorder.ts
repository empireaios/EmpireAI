/**
 * G5-05 — EKLS approval audit recorder (Pillow-governed).
 */

import { enforceEklsAccess } from "../../pillow/ekls/services/ekls-governance-gateway.js";
import type { ApprovalState } from "../contracts/approval-types.js";

export type ApprovalAuditEventType =
  | "approval_requested"
  | "approval_granted"
  | "approval_rejected"
  | "approval_expired"
  | "approval_cancelled";

export type ApprovalAuditEvent = {
  eventId: string;
  eventType: ApprovalAuditEventType;
  workspaceId: string;
  actorId: string;
  approvalId: string;
  workflowId: string;
  triggerId: string;
  correlationId: string;
  approvalState: ApprovalState;
  decisionReference?: string;
  reason: string;
  evidence?: Record<string, unknown>;
  pillowGovernance: true;
  recordedAt: string;
};

let auditSequence = 0;
const approvalAuditLog: ApprovalAuditEvent[] = [];

export function recordApprovalAuditEvent(input: {
  eventType: ApprovalAuditEventType;
  workspaceId: string;
  actorId: string;
  approvalId: string;
  workflowId: string;
  triggerId: string;
  correlationId: string;
  approvalState: ApprovalState;
  decisionReference?: string;
  reason: string;
  evidence?: Record<string, unknown>;
}): ApprovalAuditEvent {
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
    throw new Error(`EKLS approval audit rejected: ${ekls.reason}`);
  }

  auditSequence += 1;
  const event: ApprovalAuditEvent = {
    eventId: `approval-audit:${auditSequence}`,
    eventType: input.eventType,
    workspaceId: input.workspaceId,
    actorId: input.actorId,
    approvalId: input.approvalId,
    workflowId: input.workflowId,
    triggerId: input.triggerId,
    correlationId: input.correlationId,
    approvalState: input.approvalState,
    decisionReference: input.decisionReference,
    reason: input.reason,
    evidence: input.evidence,
    pillowGovernance: true,
    recordedAt: new Date().toISOString(),
  };
  approvalAuditLog.push(event);
  return event;
}

export function listApprovalAuditEvents(workspaceId?: string): readonly ApprovalAuditEvent[] {
  if (!workspaceId) return [...approvalAuditLog];
  return approvalAuditLog.filter((event) => event.workspaceId === workspaceId);
}

export function resetApprovalAuditLogForTests(): void {
  approvalAuditLog.length = 0;
  auditSequence = 0;
}
