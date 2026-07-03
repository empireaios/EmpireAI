/**
 * G5-03 — Pillow governance for workflow scheduling decisions.
 */

import { enforceEklsAccess } from "../../pillow/ekls/services/ekls-governance-gateway.js";
import type { AutomationRequest } from "../contracts/trigger-types.js";
import type { QueuedAutomationRequest, SchedulerGovernanceContext } from "../contracts/scheduler-types.js";

export type PillowSchedulerGovernanceResult = {
  eligible: boolean;
  reason: string;
  eklsGoverned: boolean;
};

export function validateSchedulerGovernanceContext(
  context: SchedulerGovernanceContext,
): PillowSchedulerGovernanceResult {
  if (!context.pillowGovernance) {
    return {
      eligible: false,
      reason: "Pillow governance required — pillowGovernance must be true",
      eklsGoverned: false,
    };
  }
  if (!context.workspaceId?.trim()) {
    return { eligible: false, reason: "workspaceId is required", eklsGoverned: false };
  }
  if (!context.actorId?.trim()) {
    return { eligible: false, reason: "actorId is required for auditability", eklsGoverned: false };
  }
  if (context.killSwitchActive) {
    return {
      eligible: false,
      reason: "Global automation kill switch active — scheduling blocked",
      eklsGoverned: false,
    };
  }

  const ekls = enforceEklsAccess(
    {
      pillowGovernance: true,
      actorId: context.actorId,
      workspaceId: context.workspaceId,
      companyId: context.companyId,
      consumerChannel: "business-automation",
      operation: "store",
    },
    context.workspaceId,
  );

  if (!ekls.allowed) {
    return { eligible: false, reason: ekls.reason, eklsGoverned: false };
  }

  return {
    eligible: true,
    reason: "Scheduling policy, execution eligibility, and workspace isolation passed",
    eklsGoverned: true,
  };
}

export function validateSchedulerIntakeRequest(
  request: Omit<AutomationRequest, "requestId" | "createdAt" | "state" | "schedulerHandoff">,
  context: SchedulerGovernanceContext,
): PillowSchedulerGovernanceResult {
  const governance = validateSchedulerGovernanceContext(context);
  if (!governance.eligible) return governance;

  if (request.triggerContext.workspaceId !== context.workspaceId) {
    return {
      eligible: false,
      reason: "Workspace isolation violation — trigger workspace does not match governance context",
      eklsGoverned: governance.eklsGoverned,
    };
  }

  if (request.approvalRouting.required) {
    return {
      eligible: false,
      reason: "Approval pending — scheduling blocked until approval completes",
      eklsGoverned: governance.eklsGoverned,
    };
  }

  return governance;
}

export function validateQueueMutation(
  entry: QueuedAutomationRequest,
  context: SchedulerGovernanceContext,
): PillowSchedulerGovernanceResult {
  const governance = validateSchedulerGovernanceContext(context);
  if (!governance.eligible) return governance;

  if (entry.workspaceId !== context.workspaceId) {
    return {
      eligible: false,
      reason: "Workspace isolation violation — queue entry workspace mismatch",
      eklsGoverned: governance.eklsGoverned,
    };
  }

  return governance;
}
