/**
 * G5-05 — Pillow governance for Approval Router decisions.
 */

import { enforceEklsAccess } from "../../pillow/ekls/services/ekls-governance-gateway.js";
import type { AutomationApprovalRequest } from "../contracts/approval-types.js";

export type PillowApprovalGovernanceResult = {
  eligible: boolean;
  reason: string;
  eklsGoverned: boolean;
};

export function validateApprovalGovernanceContext(input: {
  pillowGovernance: true;
  actorId: string;
  workspaceId: string;
  companyId?: string;
  killSwitchActive?: boolean;
}): PillowApprovalGovernanceResult {
  if (!input.pillowGovernance) {
    return {
      eligible: false,
      reason: "Pillow governance required — pillowGovernance must be true",
      eklsGoverned: false,
    };
  }
  if (!input.actorId?.trim()) {
    return { eligible: false, reason: "actorId is required for auditability", eklsGoverned: false };
  }
  if (!input.workspaceId?.trim()) {
    return { eligible: false, reason: "workspaceId is required", eklsGoverned: false };
  }
  if (input.killSwitchActive) {
    return {
      eligible: false,
      reason: "Global automation kill switch active — approval routing blocked",
      eklsGoverned: false,
    };
  }

  const ekls = enforceEklsAccess(
    {
      pillowGovernance: true,
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      companyId: input.companyId,
      consumerChannel: "business-automation",
      operation: "store",
    },
    input.workspaceId,
  );

  if (!ekls.allowed) {
    return { eligible: false, reason: ekls.reason, eklsGoverned: false };
  }

  return {
    eligible: true,
    reason: "Execution authority, policy compliance, and workspace isolation passed",
    eklsGoverned: true,
  };
}

export function validateApprovalSubmission(input: {
  pillowGovernance: true;
  actorId: string;
  workspaceId: string;
  companyId?: string;
  killSwitchActive?: boolean;
}): PillowApprovalGovernanceResult {
  return validateApprovalGovernanceContext(input);
}

export function validateApprovalMutation(
  request: AutomationApprovalRequest,
  input: {
    pillowGovernance: true;
    actorId: string;
    workspaceId: string;
    companyId?: string;
  },
): PillowApprovalGovernanceResult {
  const governance = validateApprovalGovernanceContext(input);
  if (!governance.eligible) return governance;

  if (request.workspaceId !== input.workspaceId) {
    return {
      eligible: false,
      reason: "Workspace isolation violation — approval request workspace mismatch",
      eklsGoverned: governance.eklsGoverned,
    };
  }

  return governance;
}
