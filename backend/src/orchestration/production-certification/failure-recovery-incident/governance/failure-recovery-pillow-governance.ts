/**
 * G6-08 — Failure recovery Pillow governance.
 */

import { enforceEklsAccess } from "../../../pillow/ekls/services/ekls-governance-gateway.js";

export type FailureRecoveryPillowContext = {
  actorId: string;
  workspaceId: string;
  companyId?: string;
  operation: "overview" | "failure_recovery_scan" | "score" | "status" | "override_request";
  pillowGovernance: true;
};

export type FailureRecoveryPillowResult = {
  allowed: boolean;
  reason: string;
  incidentCertificationAuthority: boolean;
  recoveryAuthority: boolean;
  rollbackAuthority: boolean;
  escalationAuthority: boolean;
  overrideAuthority: boolean;
  evidenceIntegrity: boolean;
  productionEligible: boolean;
  eklsGoverned: boolean;
};

function deny(reason: string): FailureRecoveryPillowResult {
  return {
    allowed: false,
    reason,
    incidentCertificationAuthority: false,
    recoveryAuthority: false,
    rollbackAuthority: false,
    escalationAuthority: false,
    overrideAuthority: false,
    evidenceIntegrity: false,
    productionEligible: false,
    eklsGoverned: false,
  };
}

export function validateFailureRecoveryPillowGovernance(
  context: FailureRecoveryPillowContext,
): FailureRecoveryPillowResult {
  if (!context.pillowGovernance) {
    return deny("Pillow governance required — no failure recovery certification bypass");
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
      incidentCertificationAuthority: true,
      recoveryAuthority: true,
      rollbackAuthority: true,
      escalationAuthority: true,
      overrideAuthority: context.operation === "override_request",
      evidenceIntegrity: false,
      productionEligible: false,
      eklsGoverned: false,
    };
  }

  return {
    allowed: true,
    reason: "Failure recovery Pillow governance passed",
    incidentCertificationAuthority: true,
    recoveryAuthority: true,
    rollbackAuthority: true,
    escalationAuthority: true,
    overrideAuthority: context.operation === "override_request",
    evidenceIntegrity: true,
    productionEligible: context.operation !== "override_request",
    eklsGoverned: true,
  };
}
