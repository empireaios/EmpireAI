/**
 * G7-06 — Continuous intelligence Pillow governance.
 */

import { enforceEklsAccess } from "../../pillow/ekls/services/ekls-governance-gateway.js";

export type ContinuousIntelligencePillowContext = {
  actorId: string;
  workspaceId: string;
  ownerId: string;
  operation: "overview" | "detect" | "recommend" | "schedule" | "execute" | "approve";
  pillowGovernance: true;
};

export type ContinuousIntelligencePillowResult = {
  allowed: boolean;
  reason: string;
  optimizationAuthority: boolean;
  riskPolicy: boolean;
  approvalAuthority: boolean;
  workspaceAuthority: boolean;
  productionSafety: boolean;
  constitutionalCompliance: boolean;
  eklsGoverned: boolean;
};

function deny(reason: string): ContinuousIntelligencePillowResult {
  return {
    allowed: false,
    reason,
    optimizationAuthority: false,
    riskPolicy: false,
    approvalAuthority: false,
    workspaceAuthority: false,
    productionSafety: false,
    constitutionalCompliance: false,
    eklsGoverned: false,
  };
}

export function validateContinuousIntelligencePillowGovernance(
  context: ContinuousIntelligencePillowContext,
): ContinuousIntelligencePillowResult {
  if (!context.pillowGovernance) {
    return deny("Pillow governance required — no optimization executes without governance");
  }
  if (!context.actorId?.trim() || !context.workspaceId?.trim()) {
    return deny("actorId and workspaceId are required");
  }
  if (context.ownerId !== "grand-king") {
    return deny("Grand King optimization authority required");
  }

  const ekls = enforceEklsAccess(
    {
      pillowGovernance: true,
      actorId: context.actorId,
      workspaceId: context.workspaceId,
      consumerChannel: "grand-king-continuous-intelligence-optimization",
      operation: "store",
    },
    context.workspaceId,
  );

  if (!ekls.allowed) {
    return {
      allowed: false,
      reason: ekls.reason,
      optimizationAuthority: true,
      riskPolicy: true,
      approvalAuthority: false,
      workspaceAuthority: true,
      productionSafety: true,
      constitutionalCompliance: true,
      eklsGoverned: false,
    };
  }

  return {
    allowed: true,
    reason: "Grand King continuous intelligence Pillow governance passed",
    optimizationAuthority: true,
    riskPolicy: true,
    approvalAuthority: context.operation === "approve" || context.operation === "execute",
    workspaceAuthority: true,
    productionSafety: true,
    constitutionalCompliance: true,
    eklsGoverned: true,
  };
}
