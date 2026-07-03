/**
 * G6-00 — Pillow governance for production certification.
 */

import { enforceEklsAccess } from "../../pillow/ekls/services/ekls-governance-gateway.js";

export type CertificationPillowContext = {
  actorId: string;
  workspaceId: string;
  companyId?: string;
  operation:
    | "overview"
    | "run_check"
    | "run_domain"
    | "run_full"
    | "status"
    | "blockers"
    | "evidence"
    | "override_request";
  pillowGovernance: true;
};

export type CertificationPillowResult = {
  allowed: boolean;
  reason: string;
  certificationAuthority: boolean;
  scopeValidated: boolean;
  evidenceIntegrity: boolean;
  blockerSeverityValidated: boolean;
  overrideEligible: boolean;
  productionEligible: boolean;
  eklsGoverned: boolean;
};

function deny(reason: string): CertificationPillowResult {
  return {
    allowed: false,
    reason,
    certificationAuthority: false,
    scopeValidated: false,
    evidenceIntegrity: false,
    blockerSeverityValidated: false,
    overrideEligible: false,
    productionEligible: false,
    eklsGoverned: false,
  };
}

export function validateCertificationPillowGovernance(
  context: CertificationPillowContext,
): CertificationPillowResult {
  if (!context.pillowGovernance) {
    return deny("Pillow governance required — no certification can bypass Pillow");
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
      operation: context.operation === "evidence" ? "retrieve" : "store",
    },
    context.workspaceId,
  );

  if (!ekls.allowed) {
    return {
      allowed: false,
      reason: ekls.reason,
      certificationAuthority: true,
      scopeValidated: true,
      evidenceIntegrity: true,
      blockerSeverityValidated: true,
      overrideEligible: context.operation === "override_request",
      productionEligible: false,
      eklsGoverned: false,
    };
  }

  return {
    allowed: true,
    reason: "Production certification Pillow governance passed",
    certificationAuthority: true,
    scopeValidated: true,
    evidenceIntegrity: true,
    blockerSeverityValidated: true,
    overrideEligible: context.operation === "override_request",
    productionEligible: context.operation !== "override_request",
    eklsGoverned: true,
  };
}
