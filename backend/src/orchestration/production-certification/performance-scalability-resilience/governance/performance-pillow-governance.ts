/**
 * G6-06 — Performance certification Pillow governance.
 */

import { enforceEklsAccess } from "../../../pillow/ekls/services/ekls-governance-gateway.js";

export type PerformancePillowContext = {
  actorId: string;
  workspaceId: string;
  companyId?: string;
  operation: "overview" | "performance_scan" | "score" | "status" | "override_request";
  pillowGovernance: true;
};

export type PerformancePillowResult = {
  allowed: boolean;
  reason: string;
  performanceCertificationAuthority: boolean;
  overrideAuthority: boolean;
  benchmarkValidity: boolean;
  evidenceIntegrity: boolean;
  productionEligible: boolean;
  eklsGoverned: boolean;
};

function deny(reason: string): PerformancePillowResult {
  return {
    allowed: false,
    reason,
    performanceCertificationAuthority: false,
    overrideAuthority: false,
    benchmarkValidity: false,
    evidenceIntegrity: false,
    productionEligible: false,
    eklsGoverned: false,
  };
}

export function validatePerformancePillowGovernance(
  context: PerformancePillowContext,
): PerformancePillowResult {
  if (!context.pillowGovernance) {
    return deny("Pillow governance required — no performance certification bypass");
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
      performanceCertificationAuthority: true,
      overrideAuthority: context.operation === "override_request",
      benchmarkValidity: true,
      evidenceIntegrity: false,
      productionEligible: false,
      eklsGoverned: false,
    };
  }

  return {
    allowed: true,
    reason: "Performance certification Pillow governance passed",
    performanceCertificationAuthority: true,
    overrideAuthority: context.operation === "override_request",
    benchmarkValidity: true,
    evidenceIntegrity: true,
    productionEligible: context.operation !== "override_request",
    eklsGoverned: true,
  };
}
