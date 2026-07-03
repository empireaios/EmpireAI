/**
 * G7-02 — Commerce operations Pillow governance.
 */

import { enforceEklsAccess } from "../../pillow/ekls/services/ekls-governance-gateway.js";

export type CommerceOperationsPillowContext = {
  actorId: string;
  workspaceId: string;
  ownerId: string;
  operation: "overview" | "start" | "pause" | "resume" | "stop" | "override_request";
  pillowGovernance: true;
};

export type CommerceOperationsPillowResult = {
  allowed: boolean;
  reason: string;
  productionEligibility: boolean;
  providerReadiness: boolean;
  authorizationValidity: boolean;
  workspaceAuthority: boolean;
  operationAuthority: boolean;
  riskPolicy: boolean;
  eklsGoverned: boolean;
};

function deny(reason: string): CommerceOperationsPillowResult {
  return {
    allowed: false,
    reason,
    productionEligibility: false,
    providerReadiness: false,
    authorizationValidity: false,
    workspaceAuthority: false,
    operationAuthority: false,
    riskPolicy: false,
    eklsGoverned: false,
  };
}

export function validateCommerceOperationsPillowGovernance(
  context: CommerceOperationsPillowContext,
): CommerceOperationsPillowResult {
  if (!context.pillowGovernance) {
    return deny("Pillow governance required — no commerce operation bypass");
  }
  if (!context.actorId?.trim() || !context.workspaceId?.trim()) {
    return deny("actorId and workspaceId are required");
  }
  if (context.ownerId !== "grand-king") {
    return deny("Grand King workspace authority required for commerce operations");
  }

  const ekls = enforceEklsAccess(
    {
      pillowGovernance: true,
      actorId: context.actorId,
      workspaceId: context.workspaceId,
      consumerChannel: "grand-king-commerce-operations",
      operation: "store",
    },
    context.workspaceId,
  );

  if (!ekls.allowed) {
    return {
      allowed: false,
      reason: ekls.reason,
      productionEligibility: true,
      providerReadiness: false,
      authorizationValidity: false,
      workspaceAuthority: true,
      operationAuthority: false,
      riskPolicy: true,
      eklsGoverned: false,
    };
  }

  return {
    allowed: true,
    reason: "Grand King commerce operations Pillow governance passed",
    productionEligibility: true,
    providerReadiness: true,
    authorizationValidity: true,
    workspaceAuthority: true,
    operationAuthority: true,
    riskPolicy: true,
    eklsGoverned: true,
  };
}
