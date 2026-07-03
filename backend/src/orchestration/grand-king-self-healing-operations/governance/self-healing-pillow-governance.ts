/**
 * G7-08 — Self-healing Pillow governance.
 */

import { enforceEklsAccess } from "../../pillow/ekls/services/ekls-governance-gateway.js";

export type SelfHealingPillowContext = {
  actorId: string;
  workspaceId: string;
  ownerId: string;
  operation: "overview" | "detect" | "heal" | "execute" | "pause" | "rollback";
  pillowGovernance: true;
};

export type SelfHealingPillowResult = {
  allowed: boolean;
  reason: string;
  healingAuthority: boolean;
  riskPolicy: boolean;
  productionAuthority: boolean;
  rollbackAuthority: boolean;
  approvalRequirements: boolean;
  workspaceAuthority: boolean;
  eklsGoverned: boolean;
};

function deny(reason: string): SelfHealingPillowResult {
  return {
    allowed: false,
    reason,
    healingAuthority: false,
    riskPolicy: false,
    productionAuthority: false,
    rollbackAuthority: false,
    approvalRequirements: false,
    workspaceAuthority: false,
    eklsGoverned: false,
  };
}

export function validateSelfHealingPillowGovernance(context: SelfHealingPillowContext): SelfHealingPillowResult {
  if (!context.pillowGovernance) {
    return deny("Pillow governance required — no self-healing execution bypass");
  }
  if (!context.actorId?.trim() || !context.workspaceId?.trim()) {
    return deny("actorId and workspaceId are required");
  }
  if (context.ownerId !== "grand-king") {
    return deny("Grand King healing authority required");
  }

  const ekls = enforceEklsAccess(
    {
      pillowGovernance: true,
      actorId: context.actorId,
      workspaceId: context.workspaceId,
      consumerChannel: "grand-king-self-healing-operations",
      operation: "store",
    },
    context.workspaceId,
  );

  if (!ekls.allowed) {
    return {
      allowed: false,
      reason: ekls.reason,
      healingAuthority: true,
      riskPolicy: true,
      productionAuthority: true,
      rollbackAuthority: context.operation === "rollback",
      approvalRequirements: false,
      workspaceAuthority: true,
      eklsGoverned: false,
    };
  }

  return {
    allowed: true,
    reason: "Grand King self-healing Pillow governance passed",
    healingAuthority: true,
    riskPolicy: true,
    productionAuthority: true,
    rollbackAuthority: true,
    approvalRequirements: true,
    workspaceAuthority: true,
    eklsGoverned: true,
  };
}
