/**
 * G7-03 — Business automation operations Pillow governance.
 */

import { enforceEklsAccess } from "../../pillow/ekls/services/ekls-governance-gateway.js";

export type AutomationOperationsPillowContext = {
  actorId: string;
  workspaceId: string;
  ownerId: string;
  operation: "overview" | "start" | "pause" | "resume" | "cancel" | "override_request";
  pillowGovernance: true;
};

export type AutomationOperationsPillowResult = {
  allowed: boolean;
  reason: string;
  workflowAuthority: boolean;
  executionAuthority: boolean;
  approvalAuthority: boolean;
  recoveryAuthority: boolean;
  workspaceAuthority: boolean;
  productionAuthority: boolean;
  eklsGoverned: boolean;
};

function deny(reason: string): AutomationOperationsPillowResult {
  return {
    allowed: false,
    reason,
    workflowAuthority: false,
    executionAuthority: false,
    approvalAuthority: false,
    recoveryAuthority: false,
    workspaceAuthority: false,
    productionAuthority: false,
    eklsGoverned: false,
  };
}

export function validateAutomationOperationsPillowGovernance(
  context: AutomationOperationsPillowContext,
): AutomationOperationsPillowResult {
  if (!context.pillowGovernance) {
    return deny("Pillow governance required — no automation operation bypass");
  }
  if (!context.actorId?.trim() || !context.workspaceId?.trim()) {
    return deny("actorId and workspaceId are required");
  }
  if (context.ownerId !== "grand-king") {
    return deny("Grand King workspace authority required for automation operations");
  }

  const ekls = enforceEklsAccess(
    {
      pillowGovernance: true,
      actorId: context.actorId,
      workspaceId: context.workspaceId,
      consumerChannel: "grand-king-business-automation-operations",
      operation: "store",
    },
    context.workspaceId,
  );

  if (!ekls.allowed) {
    return {
      allowed: false,
      reason: ekls.reason,
      workflowAuthority: true,
      executionAuthority: false,
      approvalAuthority: false,
      recoveryAuthority: false,
      workspaceAuthority: true,
      productionAuthority: true,
      eklsGoverned: false,
    };
  }

  return {
    allowed: true,
    reason: "Grand King business automation operations Pillow governance passed",
    workflowAuthority: true,
    executionAuthority: true,
    approvalAuthority: true,
    recoveryAuthority: true,
    workspaceAuthority: true,
    productionAuthority: true,
    eklsGoverned: true,
  };
}
