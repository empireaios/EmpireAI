/**
 * G7-00 — Live operations Pillow governance.
 */

import { enforceEklsAccess } from "../../pillow/ekls/services/ekls-governance-gateway.js";

export type LiveOperationsPillowContext = {
  actorId: string;
  workspaceId: string;
  companyId?: string;
  accountHolderId: string;
  operation: "overview" | "start" | "pause" | "resume" | "block" | "override_request";
  pillowGovernance: true;
};

export type LiveOperationsPillowResult = {
  allowed: boolean;
  reason: string;
  liveOperationAuthority: boolean;
  grandKingAccountBoundary: boolean;
  productionEligibilityValidated: boolean;
  riskAcceptance: boolean;
  overrideAuthority: boolean;
  operationalControl: boolean;
  eklsGoverned: boolean;
};

function deny(reason: string): LiveOperationsPillowResult {
  return {
    allowed: false,
    reason,
    liveOperationAuthority: false,
    grandKingAccountBoundary: false,
    productionEligibilityValidated: false,
    riskAcceptance: false,
    overrideAuthority: false,
    operationalControl: false,
    eklsGoverned: false,
  };
}

export function validateLiveOperationsPillowGovernance(
  context: LiveOperationsPillowContext,
): LiveOperationsPillowResult {
  if (!context.pillowGovernance) {
    return deny("Pillow governance required — no live operation bypass");
  }
  if (!context.actorId?.trim() || !context.workspaceId?.trim()) {
    return deny("actorId and workspaceId are required");
  }
  if (context.accountHolderId !== "grand-king" && context.operation !== "overview") {
    return deny("Grand King account boundary — only grand-king accountHolderId permitted for live operations");
  }

  const ekls = enforceEklsAccess(
    {
      pillowGovernance: true,
      actorId: context.actorId,
      workspaceId: context.workspaceId,
      companyId: context.companyId,
      consumerChannel: "grand-king-live-operations",
      operation: "store",
    },
    context.workspaceId,
  );

  if (!ekls.allowed) {
    return {
      allowed: false,
      reason: ekls.reason,
      liveOperationAuthority: true,
      grandKingAccountBoundary: context.accountHolderId === "grand-king",
      productionEligibilityValidated: false,
      riskAcceptance: false,
      overrideAuthority: context.operation === "override_request",
      operationalControl: false,
      eklsGoverned: false,
    };
  }

  return {
    allowed: true,
    reason: "Grand King live operations Pillow governance passed",
    liveOperationAuthority: true,
    grandKingAccountBoundary: true,
    productionEligibilityValidated: true,
    riskAcceptance: true,
    overrideAuthority: context.operation === "override_request",
    operationalControl: true,
    eklsGoverned: true,
  };
}
