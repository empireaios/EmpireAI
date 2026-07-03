/**
 * G7-07 — Autonomous operations Pillow governance.
 */

import { enforceEklsAccess } from "../../pillow/ekls/services/ekls-governance-gateway.js";

export type AutonomousOperationsPillowContext = {
  actorId: string;
  workspaceId: string;
  ownerId: string;
  operation: "overview" | "schedule" | "execute" | "pause" | "resume" | "cancel" | "rollback";
  pillowGovernance: true;
};

export type AutonomousOperationsPillowResult = {
  allowed: boolean;
  reason: string;
  autonomyEligibility: boolean;
  riskPolicy: boolean;
  approvalRequirements: boolean;
  productionAuthority: boolean;
  workspaceAuthority: boolean;
  rollbackEligibility: boolean;
  eklsGoverned: boolean;
};

function deny(reason: string): AutonomousOperationsPillowResult {
  return {
    allowed: false,
    reason,
    autonomyEligibility: false,
    riskPolicy: false,
    approvalRequirements: false,
    productionAuthority: false,
    workspaceAuthority: false,
    rollbackEligibility: false,
    eklsGoverned: false,
  };
}

export function validateAutonomousOperationsPillowGovernance(
  context: AutonomousOperationsPillowContext,
): AutonomousOperationsPillowResult {
  if (!context.pillowGovernance) {
    return deny("Pillow governance required — no autonomous execution bypass");
  }
  if (!context.actorId?.trim() || !context.workspaceId?.trim()) {
    return deny("actorId and workspaceId are required");
  }
  if (context.ownerId !== "grand-king") {
    return deny("Grand King autonomous authority required");
  }

  const ekls = enforceEklsAccess(
    {
      pillowGovernance: true,
      actorId: context.actorId,
      workspaceId: context.workspaceId,
      consumerChannel: "grand-king-autonomous-operations",
      operation: "store",
    },
    context.workspaceId,
  );

  if (!ekls.allowed) {
    return {
      allowed: false,
      reason: ekls.reason,
      autonomyEligibility: true,
      riskPolicy: true,
      approvalRequirements: false,
      productionAuthority: true,
      workspaceAuthority: true,
      rollbackEligibility: context.operation === "rollback",
      eklsGoverned: false,
    };
  }

  return {
    allowed: true,
    reason: "Grand King autonomous operations Pillow governance passed",
    autonomyEligibility: true,
    riskPolicy: true,
    approvalRequirements: true,
    productionAuthority: true,
    workspaceAuthority: true,
    rollbackEligibility: context.operation === "rollback" || context.operation === "cancel",
    eklsGoverned: true,
  };
}
