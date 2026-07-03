/**
 * G6-04 — Operational readiness Pillow governance.
 */

import { enforceEklsAccess } from "../../../pillow/ekls/services/ekls-governance-gateway.js";

export type OperationalReadinessPillowContext = {
  actorId: string;
  workspaceId: string;
  companyId?: string;
  operation: "overview" | "operational_scan" | "blockers" | "score" | "status" | "override_request";
  pillowGovernance: true;
};

export type OperationalReadinessPillowResult = {
  allowed: boolean;
  reason: string;
  operationalAuthority: boolean;
  workspaceAuthority: boolean;
  readinessAuthority: boolean;
  overrideAuthority: boolean;
  productionEligible: boolean;
  eklsGoverned: boolean;
};

function deny(reason: string): OperationalReadinessPillowResult {
  return {
    allowed: false,
    reason,
    operationalAuthority: false,
    workspaceAuthority: false,
    readinessAuthority: false,
    overrideAuthority: false,
    productionEligible: false,
    eklsGoverned: false,
  };
}

export function validateOperationalReadinessPillowGovernance(
  context: OperationalReadinessPillowContext,
): OperationalReadinessPillowResult {
  if (!context.pillowGovernance) {
    return deny("Pillow governance required — no operational certification bypass");
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
      operationalAuthority: true,
      workspaceAuthority: true,
      readinessAuthority: true,
      overrideAuthority: context.operation === "override_request",
      productionEligible: false,
      eklsGoverned: false,
    };
  }

  return {
    allowed: true,
    reason: "Operational readiness Pillow governance passed",
    operationalAuthority: true,
    workspaceAuthority: true,
    readinessAuthority: true,
    overrideAuthority: context.operation === "override_request",
    productionEligible: context.operation !== "override_request",
    eklsGoverned: true,
  };
}
