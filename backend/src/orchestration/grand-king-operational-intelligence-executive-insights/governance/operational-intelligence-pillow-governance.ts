/**
 * G7-09 — Operational intelligence Pillow governance.
 */

import { enforceEklsAccess } from "../../pillow/ekls/services/ekls-governance-gateway.js";

export type OperationalIntelligencePillowContext = {
  actorId: string;
  workspaceId: string;
  ownerId: string;
  operation: "overview" | "aggregate" | "insight" | "predict" | "recommend" | "briefing";
  pillowGovernance: true;
};

export type OperationalIntelligencePillowResult = {
  allowed: boolean;
  reason: string;
  insightAuthority: boolean;
  recommendationAuthority: boolean;
  workspaceAuthority: boolean;
  evidenceIntegrity: boolean;
  riskClassification: boolean;
  executiveVisibility: boolean;
  eklsGoverned: boolean;
};

function deny(reason: string): OperationalIntelligencePillowResult {
  return {
    allowed: false,
    reason,
    insightAuthority: false,
    recommendationAuthority: false,
    workspaceAuthority: false,
    evidenceIntegrity: false,
    riskClassification: false,
    executiveVisibility: false,
    eklsGoverned: false,
  };
}

export function validateOperationalIntelligencePillowGovernance(
  context: OperationalIntelligencePillowContext,
): OperationalIntelligencePillowResult {
  if (!context.pillowGovernance) {
    return deny("Pillow governance required — no executive intelligence bypass");
  }
  if (!context.actorId?.trim() || !context.workspaceId?.trim()) {
    return deny("actorId and workspaceId are required");
  }
  if (context.ownerId !== "grand-king") {
    return deny("Grand King executive intelligence authority required");
  }

  const ekls = enforceEklsAccess(
    {
      pillowGovernance: true,
      actorId: context.actorId,
      workspaceId: context.workspaceId,
      consumerChannel: "grand-king-operational-intelligence-executive-insights",
      operation: "store",
    },
    context.workspaceId,
  );

  if (!ekls.allowed) {
    return {
      allowed: false,
      reason: ekls.reason,
      insightAuthority: true,
      recommendationAuthority: context.operation === "recommend",
      workspaceAuthority: true,
      evidenceIntegrity: false,
      riskClassification: true,
      executiveVisibility: true,
      eklsGoverned: false,
    };
  }

  return {
    allowed: true,
    reason: "Grand King operational intelligence Pillow governance passed",
    insightAuthority: true,
    recommendationAuthority: true,
    workspaceAuthority: true,
    evidenceIntegrity: true,
    riskClassification: true,
    executiveVisibility: true,
    eklsGoverned: true,
  };
}
