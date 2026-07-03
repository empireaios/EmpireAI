/**
 * G6-07 — Executive operations Pillow governance.
 */

import { enforceEklsAccess } from "../../../pillow/ekls/services/ekls-governance-gateway.js";

export type ExecutiveOperationsPillowContext = {
  actorId: string;
  workspaceId: string;
  companyId?: string;
  operation: "overview" | "executive_scan" | "score" | "status" | "override_request";
  pillowGovernance: true;
};

export type ExecutiveOperationsPillowResult = {
  allowed: boolean;
  reason: string;
  executiveActionAuthority: boolean;
  approvalAuthority: boolean;
  visibilityAuthority: boolean;
  overrideAuthority: boolean;
  certificationAuthority: boolean;
  productionEligible: boolean;
  eklsGoverned: boolean;
};

function deny(reason: string): ExecutiveOperationsPillowResult {
  return {
    allowed: false,
    reason,
    executiveActionAuthority: false,
    approvalAuthority: false,
    visibilityAuthority: false,
    overrideAuthority: false,
    certificationAuthority: false,
    productionEligible: false,
    eklsGoverned: false,
  };
}

export function validateExecutiveOperationsPillowGovernance(
  context: ExecutiveOperationsPillowContext,
): ExecutiveOperationsPillowResult {
  if (!context.pillowGovernance) {
    return deny("Pillow governance required — no executive certification bypass");
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
      executiveActionAuthority: true,
      approvalAuthority: true,
      visibilityAuthority: true,
      overrideAuthority: context.operation === "override_request",
      certificationAuthority: true,
      productionEligible: false,
      eklsGoverned: false,
    };
  }

  return {
    allowed: true,
    reason: "Executive operations Pillow governance passed",
    executiveActionAuthority: true,
    approvalAuthority: true,
    visibilityAuthority: true,
    overrideAuthority: context.operation === "override_request",
    certificationAuthority: true,
    productionEligible: context.operation !== "override_request",
    eklsGoverned: true,
  };
}
