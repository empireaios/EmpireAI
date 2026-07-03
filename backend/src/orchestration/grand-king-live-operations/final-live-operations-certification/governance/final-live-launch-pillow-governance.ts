/**
 * G7-10 — Final live launch Pillow governance.
 */

import { enforceEklsAccess } from "../../../pillow/ekls/services/ekls-governance-gateway.js";

export type FinalLiveLaunchPillowContext = {
  actorId: string;
  workspaceId: string;
  ownerId: string;
  operation: "overview" | "run_launch" | "eligibility" | "override_request";
  pillowGovernance: true;
};

export type FinalLiveLaunchPillowResult = {
  allowed: boolean;
  reason: string;
  launchAuthority: boolean;
  productionAuthority: boolean;
  workspaceAuthority: boolean;
  riskAcceptance: boolean;
  overrideAuthority: boolean;
  constitutionalCompliance: boolean;
  eklsGoverned: boolean;
};

function deny(reason: string): FinalLiveLaunchPillowResult {
  return {
    allowed: false,
    reason,
    launchAuthority: false,
    productionAuthority: false,
    workspaceAuthority: false,
    riskAcceptance: false,
    overrideAuthority: false,
    constitutionalCompliance: false,
    eklsGoverned: false,
  };
}

export function validateFinalLiveLaunchPillowGovernance(
  context: FinalLiveLaunchPillowContext,
): FinalLiveLaunchPillowResult {
  if (!context.pillowGovernance) {
    return deny("Pillow governance required — no live launch certification bypass");
  }
  if (!context.actorId?.trim() || !context.workspaceId?.trim()) {
    return deny("actorId and workspaceId are required");
  }
  if (context.ownerId !== "grand-king") {
    return deny("Grand King launch authority required");
  }

  const ekls = enforceEklsAccess(
    {
      pillowGovernance: true,
      actorId: context.actorId,
      workspaceId: context.workspaceId,
      consumerChannel: "grand-king-live-operations",
      operation: "store",
    },
    context.workspaceId,
  );

  if (!ekls.allowed) {
    return {
      allowed: false,
      reason: ekls.reason,
      launchAuthority: true,
      productionAuthority: true,
      workspaceAuthority: true,
      riskAcceptance: false,
      overrideAuthority: context.operation === "override_request",
      constitutionalCompliance: false,
      eklsGoverned: false,
    };
  }

  return {
    allowed: true,
    reason: "Grand King live launch Pillow governance passed",
    launchAuthority: true,
    productionAuthority: true,
    workspaceAuthority: true,
    riskAcceptance: true,
    overrideAuthority: context.operation === "override_request",
    constitutionalCompliance: true,
    eklsGoverned: true,
  };
}
