/**
 * G6-01 — Platform integrity Pillow governance.
 */

import { enforceEklsAccess } from "../../../pillow/ekls/services/ekls-governance-gateway.js";

export type PlatformIntegrityPillowContext = {
  actorId: string;
  workspaceId: string;
  companyId?: string;
  operation: "overview" | "scan" | "matrix" | "status" | "override_request";
  pillowGovernance: true;
};

export type PlatformIntegrityPillowResult = {
  allowed: boolean;
  reason: string;
  certificationAuthority: boolean;
  ownershipAuthority: boolean;
  overrideAuthority: boolean;
  evidenceIntegrity: boolean;
  constitutionalCompliance: boolean;
  eklsGoverned: boolean;
};

function deny(reason: string): PlatformIntegrityPillowResult {
  return {
    allowed: false,
    reason,
    certificationAuthority: false,
    ownershipAuthority: false,
    overrideAuthority: false,
    evidenceIntegrity: false,
    constitutionalCompliance: false,
    eklsGoverned: false,
  };
}

export function validatePlatformIntegrityPillowGovernance(
  context: PlatformIntegrityPillowContext,
): PlatformIntegrityPillowResult {
  if (!context.pillowGovernance) {
    return deny("Pillow governance required — no platform integrity certification bypass");
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
      certificationAuthority: true,
      ownershipAuthority: true,
      overrideAuthority: context.operation === "override_request",
      evidenceIntegrity: true,
      constitutionalCompliance: false,
      eklsGoverned: false,
    };
  }

  return {
    allowed: true,
    reason: "Platform integrity Pillow governance passed",
    certificationAuthority: true,
    ownershipAuthority: true,
    overrideAuthority: context.operation === "override_request",
    evidenceIntegrity: true,
    constitutionalCompliance: true,
    eklsGoverned: true,
  };
}
