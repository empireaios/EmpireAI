/**
 * G6-02 — Security governance Pillow governance.
 */

import { enforceEklsAccess } from "../../../pillow/ekls/services/ekls-governance-gateway.js";

export type SecurityGovernancePillowContext = {
  actorId: string;
  workspaceId: string;
  companyId?: string;
  operation: "overview" | "security_scan" | "governance_scan" | "workspace" | "plugin" | "status" | "override_request";
  pillowGovernance: true;
};

export type SecurityGovernancePillowResult = {
  allowed: boolean;
  reason: string;
  securityAuthority: boolean;
  governanceAuthority: boolean;
  certificationAuthority: boolean;
  overrideAuthority: boolean;
  constitutionalCompliance: boolean;
  eklsGoverned: boolean;
};

function deny(reason: string): SecurityGovernancePillowResult {
  return {
    allowed: false,
    reason,
    securityAuthority: false,
    governanceAuthority: false,
    certificationAuthority: false,
    overrideAuthority: false,
    constitutionalCompliance: false,
    eklsGoverned: false,
  };
}

export function validateSecurityGovernancePillowGovernance(
  context: SecurityGovernancePillowContext,
): SecurityGovernancePillowResult {
  if (!context.pillowGovernance) {
    return deny("Pillow governance required — no security certification bypass");
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
      securityAuthority: true,
      governanceAuthority: true,
      certificationAuthority: true,
      overrideAuthority: context.operation === "override_request",
      constitutionalCompliance: false,
      eklsGoverned: false,
    };
  }

  return {
    allowed: true,
    reason: "Security governance Pillow validation passed",
    securityAuthority: true,
    governanceAuthority: true,
    certificationAuthority: true,
    overrideAuthority: context.operation === "override_request",
    constitutionalCompliance: true,
    eklsGoverned: true,
  };
}
