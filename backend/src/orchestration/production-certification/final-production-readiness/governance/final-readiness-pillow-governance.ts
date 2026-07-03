/**
 * G6-10 — Final production readiness Pillow governance.
 */

import { enforceEklsAccess } from "../../../pillow/ekls/services/ekls-governance-gateway.js";

export type FinalReadinessPillowContext = {
  actorId: string;
  workspaceId: string;
  companyId?: string;
  operation: "overview" | "run_final" | "eligibility" | "override_request";
  pillowGovernance: true;
};

export type FinalReadinessPillowResult = {
  allowed: boolean;
  reason: string;
  finalCertificationAuthority: boolean;
  productionEligibilityAuthority: boolean;
  blockerSeverityValidated: boolean;
  overrideEligibility: boolean;
  evidenceIntegrity: boolean;
  grandKingReadinessAuthority: boolean;
  eklsGoverned: boolean;
};

function deny(reason: string): FinalReadinessPillowResult {
  return {
    allowed: false,
    reason,
    finalCertificationAuthority: false,
    productionEligibilityAuthority: false,
    blockerSeverityValidated: false,
    overrideEligibility: false,
    evidenceIntegrity: false,
    grandKingReadinessAuthority: false,
    eklsGoverned: false,
  };
}

export function validateFinalReadinessPillowGovernance(
  context: FinalReadinessPillowContext,
): FinalReadinessPillowResult {
  if (!context.pillowGovernance) {
    return deny("Pillow governance required — no final certification bypass");
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
      finalCertificationAuthority: true,
      productionEligibilityAuthority: true,
      blockerSeverityValidated: false,
      overrideEligibility: context.operation === "override_request",
      evidenceIntegrity: false,
      grandKingReadinessAuthority: true,
      eklsGoverned: false,
    };
  }

  return {
    allowed: true,
    reason: "Final production readiness Pillow governance passed",
    finalCertificationAuthority: true,
    productionEligibilityAuthority: true,
    blockerSeverityValidated: true,
    overrideEligibility: context.operation === "override_request",
    evidenceIntegrity: true,
    grandKingReadinessAuthority: true,
    eklsGoverned: true,
  };
}
