/**
 * G5-04 — EKLS orchestrator audit recorder (Pillow-governed).
 */

import { enforceEklsAccess } from "../../pillow/ekls/services/ekls-governance-gateway.js";
import type { WorkflowLifecycleState } from "../contracts/orchestrator-types.js";

export type OrchestratorAuditEventType =
  | "workflow_execution"
  | "step_completion"
  | "execution_outcome"
  | "failure_event"
  | "recovery_event"
  | "execution_evidence";

export type OrchestratorAuditEvent = {
  eventId: string;
  eventType: OrchestratorAuditEventType;
  workspaceId: string;
  actorId: string;
  executionId: string;
  queueId: string;
  workflowId: string;
  stepId?: string;
  correlationId: string;
  lifecycleState: WorkflowLifecycleState;
  reason: string;
  evidence?: Record<string, unknown>;
  pillowGovernance: true;
  recordedAt: string;
};

let auditSequence = 0;
const orchestratorAuditLog: OrchestratorAuditEvent[] = [];

export function recordOrchestratorAuditEvent(input: {
  eventType: OrchestratorAuditEventType;
  workspaceId: string;
  actorId: string;
  executionId: string;
  queueId: string;
  workflowId: string;
  stepId?: string;
  correlationId: string;
  lifecycleState: WorkflowLifecycleState;
  reason: string;
  evidence?: Record<string, unknown>;
}): OrchestratorAuditEvent {
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
    throw new Error(`EKLS orchestrator audit rejected: ${ekls.reason}`);
  }

  auditSequence += 1;
  const event: OrchestratorAuditEvent = {
    eventId: `orchestrator-audit:${auditSequence}`,
    eventType: input.eventType,
    workspaceId: input.workspaceId,
    actorId: input.actorId,
    executionId: input.executionId,
    queueId: input.queueId,
    workflowId: input.workflowId,
    stepId: input.stepId,
    correlationId: input.correlationId,
    lifecycleState: input.lifecycleState,
    reason: input.reason,
    evidence: input.evidence,
    pillowGovernance: true,
    recordedAt: new Date().toISOString(),
  };
  orchestratorAuditLog.push(event);
  return event;
}

export function listOrchestratorAuditEvents(
  workspaceId?: string,
): readonly OrchestratorAuditEvent[] {
  if (!workspaceId) return [...orchestratorAuditLog];
  return orchestratorAuditLog.filter((event) => event.workspaceId === workspaceId);
}

export function resetOrchestratorAuditLogForTests(): void {
  orchestratorAuditLog.length = 0;
  auditSequence = 0;
}
