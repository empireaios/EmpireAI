/**
 * G5-07 — Pillow governance for Cockpit executive automation actions.
 */

import { validateRecoveryGovernanceContext } from "../governance/recovery-pillow-governance.js";
import { validateApprovalGovernanceContext } from "../governance/approval-pillow-governance.js";

export type CockpitAutomationAction =
  | "approve"
  | "reject"
  | "pause"
  | "resume"
  | "cancel"
  | "retry"
  | "rollback";

export type CockpitAutomationActionResult = {
  allowed: boolean;
  reason: string;
  pillowGoverned: true;
};

export function validateCockpitAutomationAction(input: {
  action: CockpitAutomationAction;
  actorId: string;
  workspaceId: string;
  companyId?: string;
  killSwitchActive?: boolean;
}): CockpitAutomationActionResult {
  if (!input.actorId?.trim()) {
    return { allowed: false, reason: "actorId is required", pillowGoverned: true };
  }
  if (!input.workspaceId?.trim()) {
    return { allowed: false, reason: "workspaceId is required", pillowGoverned: true };
  }
  if (input.killSwitchActive) {
    return { allowed: false, reason: "Kill switch active — executive action blocked", pillowGoverned: true };
  }

  if (input.action === "approve" || input.action === "reject") {
    const approval = validateApprovalGovernanceContext({
      pillowGovernance: true,
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      companyId: input.companyId,
    });
    return {
      allowed: approval.eligible,
      reason: approval.reason,
      pillowGoverned: true,
    };
  }

  if (input.action === "rollback" || input.action === "retry") {
    const recovery = validateRecoveryGovernanceContext({
      pillowGovernance: true,
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      companyId: input.companyId,
    });
    return {
      allowed: recovery.eligible,
      reason: recovery.reason,
      pillowGoverned: true,
    };
  }

  const recovery = validateRecoveryGovernanceContext({
    pillowGovernance: true,
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    companyId: input.companyId,
  });

  return {
    allowed: recovery.eligible,
    reason: recovery.reason,
    pillowGoverned: true,
  };
}
