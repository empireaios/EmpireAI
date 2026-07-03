/**
 * G5-06 — Pillow governance for recovery and rollback operations.
 */

import { enforceEklsAccess } from "../../pillow/ekls/services/ekls-governance-gateway.js";

export type PillowRecoveryGovernanceResult = {
  eligible: boolean;
  reason: string;
  eklsGoverned: boolean;
};

export function validateRecoveryGovernanceContext(input: {
  pillowGovernance: true;
  actorId: string;
  workspaceId: string;
  companyId?: string;
  killSwitchActive?: boolean;
}): PillowRecoveryGovernanceResult {
  if (!input.pillowGovernance) {
    return {
      eligible: false,
      reason: "Pillow governance required — pillowGovernance must be true",
      eklsGoverned: false,
    };
  }
  if (!input.actorId?.trim()) {
    return { eligible: false, reason: "actorId is required", eklsGoverned: false };
  }
  if (!input.workspaceId?.trim()) {
    return { eligible: false, reason: "workspaceId is required", eklsGoverned: false };
  }
  if (input.killSwitchActive) {
    return {
      eligible: false,
      reason: "Kill switch active — recovery blocked",
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
    reason: "Recovery eligibility, rollback authority, and workspace isolation passed",
    eklsGoverned: true,
  };
}

export function validateRecoveryMutation(input: {
  pillowGovernance: true;
  actorId: string;
  workspaceId: string;
  companyId?: string;
  executionId: string;
  killSwitchActive?: boolean;
}): PillowRecoveryGovernanceResult {
  return validateRecoveryGovernanceContext(input);
}
