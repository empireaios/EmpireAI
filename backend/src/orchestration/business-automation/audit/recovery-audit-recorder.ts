/**
 * G5-06 — EKLS recovery audit recorder (Pillow-governed).
 */

import { enforceEklsAccess } from "../../pillow/ekls/services/ekls-governance-gateway.js";
import type { FailureCategory, RecoveryState } from "../contracts/recovery-types.js";

export type RecoveryAuditEventType =
  | "failure_history"
  | "recovery_history"
  | "rollback_history"
  | "root_cause"
  | "lessons_learned";

export type RecoveryAuditEvent = {
  eventId: string;
  eventType: RecoveryAuditEventType;
  workspaceId: string;
  actorId: string;
  recoveryId: string;
  executionId: string;
  workflowId: string;
  correlationId: string;
  recoveryState: RecoveryState;
  failureCategory?: FailureCategory;
  reason: string;
  evidence?: Record<string, unknown>;
  pillowGovernance: true;
  recordedAt: string;
};

let auditSequence = 0;
const recoveryAuditLog: RecoveryAuditEvent[] = [];

export function recordRecoveryAuditEvent(input: {
  eventType: RecoveryAuditEventType;
  workspaceId: string;
  actorId: string;
  recoveryId: string;
  executionId: string;
  workflowId: string;
  correlationId: string;
  recoveryState: RecoveryState;
  failureCategory?: FailureCategory;
  reason: string;
  evidence?: Record<string, unknown>;
}): RecoveryAuditEvent {
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
    throw new Error(`EKLS recovery audit rejected: ${ekls.reason}`);
  }

  auditSequence += 1;
  const event: RecoveryAuditEvent = {
    eventId: `recovery-audit:${auditSequence}`,
    eventType: input.eventType,
    workspaceId: input.workspaceId,
    actorId: input.actorId,
    recoveryId: input.recoveryId,
    executionId: input.executionId,
    workflowId: input.workflowId,
    correlationId: input.correlationId,
    recoveryState: input.recoveryState,
    failureCategory: input.failureCategory,
    reason: input.reason,
    evidence: input.evidence,
    pillowGovernance: true,
    recordedAt: new Date().toISOString(),
  };
  recoveryAuditLog.push(event);
  return event;
}

export function listRecoveryAuditEvents(workspaceId?: string): readonly RecoveryAuditEvent[] {
  if (!workspaceId) return [...recoveryAuditLog];
  return recoveryAuditLog.filter((event) => event.workspaceId === workspaceId);
}

export function resetRecoveryAuditLogForTests(): void {
  recoveryAuditLog.length = 0;
  auditSequence = 0;
}
