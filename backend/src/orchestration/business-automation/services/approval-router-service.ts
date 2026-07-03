/**
 * G5-05 — Approval Router service (Brain tool handlers).
 */

import type { CockpitApprovalStatusSnapshot } from "../contracts/approval-types.js";
import { getPillowApprovalRouter } from "../approval/pillow-approval-router.js";
import { getApprovalRequestStore } from "../approval/approval-request-store.js";
import { resolveApprovalPolicy } from "../approval/approval-policy-resolver.js";

export function evaluateAutomationApprovalRequirement(input: {
  approvalRegistryId?: string;
  policyRegistryId?: string;
  payload?: Record<string, unknown>;
}) {
  return getPillowApprovalRouter().evaluateRequirement(input);
}

export async function submitAutomationApproval(input: {
  actorId: string;
  workspaceId: string;
  workflowId: string;
  workflowVersion?: string;
  executionId?: string;
  triggerId: string;
  queueId?: string;
  correlationId: string;
  decisionReference?: string;
  approvalRegistryId?: string;
  policyRegistryId?: string;
  companyId?: string;
  brandId?: string;
  payload?: Record<string, unknown>;
  supportingEvidence?: Record<string, unknown>;
}) {
  const request = await getPillowApprovalRouter().submitApprovalRequest({
    actorId: input.actorId,
    pillowGovernance: true,
    workspaceId: input.workspaceId,
    workflowId: input.workflowId,
    workflowVersion: input.workflowVersion,
    executionId: input.executionId,
    triggerId: input.triggerId,
    queueId: input.queueId,
    correlationId: input.correlationId,
    decisionReference: input.decisionReference,
    approvalRegistryId: input.approvalRegistryId,
    policyRegistryId: input.policyRegistryId,
    companyId: input.companyId,
    brandId: input.brandId,
    payload: input.payload,
    supportingEvidence: input.supportingEvidence,
  });
  return {
    approvalId: request.approvalId,
    approvalState: request.approvalState,
    approvalTier: request.approvalTier,
    expiryAt: request.expiryAt,
  };
}

export async function grantAutomationApproval(input: {
  approvalId: string;
  actorId: string;
  workspaceId: string;
  reason?: string;
}) {
  const request = await getPillowApprovalRouter().grantApproval({
    approvalId: input.approvalId,
    actorId: input.actorId,
    pillowGovernance: true,
    workspaceId: input.workspaceId,
    reason: input.reason,
  });
  return {
    approvalId: request.approvalId,
    approvalState: request.approvalState,
  };
}

export async function rejectAutomationApproval(input: {
  approvalId: string;
  actorId: string;
  workspaceId: string;
  reason?: string;
}) {
  const request = await getPillowApprovalRouter().rejectApproval({
    approvalId: input.approvalId,
    actorId: input.actorId,
    pillowGovernance: true,
    workspaceId: input.workspaceId,
    reason: input.reason,
  });
  return {
    approvalId: request.approvalId,
    approvalState: request.approvalState,
  };
}

export async function cancelAutomationApproval(input: {
  approvalId: string;
  actorId: string;
  workspaceId: string;
  reason?: string;
}) {
  const request = await getPillowApprovalRouter().cancelApproval({
    approvalId: input.approvalId,
    actorId: input.actorId,
    pillowGovernance: true,
    workspaceId: input.workspaceId,
    reason: input.reason,
  });
  return {
    approvalId: request.approvalId,
    approvalState: request.approvalState,
  };
}

export function getAutomationApprovalStatus(approvalId: string) {
  const request = getPillowApprovalRouter().getApprovalStatus(approvalId);
  if (!request) return { found: false as const };
  return {
    found: true as const,
    approvalId: request.approvalId,
    approvalState: request.approvalState,
    approvalTier: request.approvalTier,
    workflowId: request.workflowId,
    triggerId: request.triggerId,
    correlationId: request.correlationId,
    history: request.history,
  };
}

export function getCockpitAutomationApprovalStatus(
  workspaceId: string,
): CockpitApprovalStatusSnapshot {
  return getPillowApprovalRouter().getCockpitApprovalStatus(workspaceId);
}

export function getAutomationApprovalSnapshot(workspaceId?: string) {
  return getApprovalRequestStore().snapshot(workspaceId);
}

export function resolveAutomationApprovalPolicyPreview(input: {
  approvalRegistryId?: string;
  policyRegistryId?: string;
  payload?: Record<string, unknown>;
}) {
  return resolveApprovalPolicy(input);
}

export async function expireDueAutomationApprovals(input?: { nowIso?: string }) {
  const expired = getPillowApprovalRouter().checkExpiredApprovals(input?.nowIso);
  return {
    expiredCount: expired.length,
    approvalIds: expired.map((request) => request.approvalId),
  };
}
