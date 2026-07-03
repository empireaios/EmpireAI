/**
 * G6-03 — Infrastructure deployment Pillow governance.
 */

import { enforceEklsAccess } from "../../../pillow/ekls/services/ekls-governance-gateway.js";

export type InfrastructureDeploymentPillowContext = {
  actorId: string;
  workspaceId: string;
  companyId?: string;
  operation: "overview" | "deployment_scan" | "health" | "readiness" | "status" | "override_request";
  pillowGovernance: true;
};

export type InfrastructureDeploymentPillowResult = {
  allowed: boolean;
  reason: string;
  deploymentAuthority: boolean;
  environmentAuthority: boolean;
  certificationAuthority: boolean;
  overrideAuthority: boolean;
  productionEligible: boolean;
  eklsGoverned: boolean;
};

function deny(reason: string): InfrastructureDeploymentPillowResult {
  return {
    allowed: false,
    reason,
    deploymentAuthority: false,
    environmentAuthority: false,
    certificationAuthority: false,
    overrideAuthority: false,
    productionEligible: false,
    eklsGoverned: false,
  };
}

export function validateInfrastructureDeploymentPillowGovernance(
  context: InfrastructureDeploymentPillowContext,
): InfrastructureDeploymentPillowResult {
  if (!context.pillowGovernance) {
    return deny("Pillow governance required — no deployment certification bypass");
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
      deploymentAuthority: true,
      environmentAuthority: true,
      certificationAuthority: true,
      overrideAuthority: context.operation === "override_request",
      productionEligible: false,
      eklsGoverned: false,
    };
  }

  return {
    allowed: true,
    reason: "Infrastructure deployment Pillow governance passed",
    deploymentAuthority: true,
    environmentAuthority: true,
    certificationAuthority: true,
    overrideAuthority: context.operation === "override_request",
    productionEligible: context.operation !== "override_request",
    eklsGoverned: true,
  };
}
