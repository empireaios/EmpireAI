/**
 * G6-05 — Business operations Pillow governance.
 */

import { enforceEklsAccess } from "../../../pillow/ekls/services/ekls-governance-gateway.js";

export type BusinessOperationsPillowContext = {
  actorId: string;
  workspaceId: string;
  companyId?: string;
  operation: "overview" | "business_scan" | "score" | "status" | "override_request";
  pillowGovernance: true;
};

export type BusinessOperationsPillowResult = {
  allowed: boolean;
  reason: string;
  businessAuthority: boolean;
  commerceAuthority: boolean;
  workflowAuthority: boolean;
  certificationAuthority: boolean;
  overrideAuthority: boolean;
  productionEligible: boolean;
  eklsGoverned: boolean;
};

function deny(reason: string): BusinessOperationsPillowResult {
  return {
    allowed: false,
    reason,
    businessAuthority: false,
    commerceAuthority: false,
    workflowAuthority: false,
    certificationAuthority: false,
    overrideAuthority: false,
    productionEligible: false,
    eklsGoverned: false,
  };
}

export function validateBusinessOperationsPillowGovernance(
  context: BusinessOperationsPillowContext,
): BusinessOperationsPillowResult {
  if (!context.pillowGovernance) {
    return deny("Pillow governance required — no business certification bypass");
  }
  if (!context.actorId?.trim() || !context.workspaceId?.trim()) {
    return deny("actorId and workspaceId are required");
  }

  const ekls = enforceEklsAccess(
    {
      pillowGovernance: true,
      actorId: context.actorId,
      workspaceId: context.workspaceId,
      companyId: context.companyId,
      consumerChannel: "production-certification",
      operation: "store",
    },
    context.workspaceId,
  );

  if (!ekls.allowed) {
    return {
      allowed: false,
      reason: ekls.reason,
      businessAuthority: true,
      commerceAuthority: true,
      workflowAuthority: true,
      certificationAuthority: true,
      overrideAuthority: context.operation === "override_request",
      productionEligible: false,
      eklsGoverned: false,
    };
  }

  return {
    allowed: true,
    reason: "Business operations Pillow governance passed",
    businessAuthority: true,
    commerceAuthority: true,
    workflowAuthority: true,
    certificationAuthority: true,
    overrideAuthority: context.operation === "override_request",
    productionEligible: context.operation !== "override_request",
    eklsGoverned: true,
  };
}
