/**
 * G7-04 — Executive decision Pillow governance.
 */

import { enforceEklsAccess } from "../../pillow/ekls/services/ekls-governance-gateway.js";

export type ExecutiveDecisionPillowContext = {
  actorId: string;
  workspaceId: string;
  ownerId: string;
  operation: "overview" | "approve" | "reject" | "execute" | "override";
  pillowGovernance: true;
};

export type ExecutiveDecisionPillowResult = {
  allowed: boolean;
  reason: string;
  decisionAuthority: boolean;
  approvalAuthority: boolean;
  workspaceAuthority: boolean;
  productionAuthority: boolean;
  overrideAuthority: boolean;
  riskPolicy: boolean;
  eklsGoverned: boolean;
};

function deny(reason: string): ExecutiveDecisionPillowResult {
  return {
    allowed: false,
    reason,
    decisionAuthority: false,
    approvalAuthority: false,
    workspaceAuthority: false,
    productionAuthority: false,
    overrideAuthority: false,
    riskPolicy: false,
    eklsGoverned: false,
  };
}

export function validateExecutiveDecisionPillowGovernance(
  context: ExecutiveDecisionPillowContext,
): ExecutiveDecisionPillowResult {
  if (!context.pillowGovernance) {
    return deny("Pillow governance required — no executive decision bypass");
  }
  if (!context.actorId?.trim() || !context.workspaceId?.trim()) {
    return deny("actorId and workspaceId are required");
  }
  if (context.ownerId !== "grand-king") {
    return deny("Grand King executive authority required");
  }

  const ekls = enforceEklsAccess(
    {
      pillowGovernance: true,
      actorId: context.actorId,
      workspaceId: context.workspaceId,
      consumerChannel: "grand-king-executive-decision-centre",
      operation: "store",
    },
    context.workspaceId,
  );

  if (!ekls.allowed) {
    return {
      allowed: false,
      reason: ekls.reason,
      decisionAuthority: true,
      approvalAuthority: false,
      workspaceAuthority: true,
      productionAuthority: true,
      overrideAuthority: context.operation === "override",
      riskPolicy: true,
      eklsGoverned: false,
    };
  }

  return {
    allowed: true,
    reason: "Grand King executive decision Pillow governance passed",
    decisionAuthority: true,
    approvalAuthority: true,
    workspaceAuthority: true,
    productionAuthority: true,
    overrideAuthority: context.operation === "override",
    riskPolicy: true,
    eklsGoverned: true,
  };
}
