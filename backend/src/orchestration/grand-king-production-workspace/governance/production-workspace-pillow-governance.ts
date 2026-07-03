/**
 * G7-01 — Production workspace Pillow governance.
 */

import { enforceEklsAccess } from "../../pillow/ekls/services/ekls-governance-gateway.js";

export type ProductionWorkspacePillowContext = {
  actorId: string;
  workspaceId: string;
  ownerId: string;
  operation: "overview" | "activate" | "configure" | "block" | "override_request";
  pillowGovernance: true;
};

export type ProductionWorkspacePillowResult = {
  allowed: boolean;
  reason: string;
  workspaceOwnership: boolean;
  productionAuthority: boolean;
  environmentIntegrity: boolean;
  workspaceReadiness: boolean;
  workspaceIsolation: boolean;
  constitutionalCompliance: boolean;
  eklsGoverned: boolean;
};

function deny(reason: string): ProductionWorkspacePillowResult {
  return {
    allowed: false,
    reason,
    workspaceOwnership: false,
    productionAuthority: false,
    environmentIntegrity: false,
    workspaceReadiness: false,
    workspaceIsolation: false,
    constitutionalCompliance: false,
    eklsGoverned: false,
  };
}

export function validateProductionWorkspacePillowGovernance(
  context: ProductionWorkspacePillowContext,
): ProductionWorkspacePillowResult {
  if (!context.pillowGovernance) {
    return deny("Pillow governance required — no workspace bypass");
  }
  if (!context.actorId?.trim() || !context.workspaceId?.trim()) {
    return deny("actorId and workspaceId are required");
  }
  if (context.ownerId !== "grand-king") {
    return deny("Grand King workspace ownership required");
  }

  const ekls = enforceEklsAccess(
    {
      pillowGovernance: true,
      actorId: context.actorId,
      workspaceId: context.workspaceId,
      consumerChannel: "grand-king-production-workspace",
      operation: "store",
    },
    context.workspaceId,
  );

  if (!ekls.allowed) {
    return {
      allowed: false,
      reason: ekls.reason,
      workspaceOwnership: true,
      productionAuthority: true,
      environmentIntegrity: false,
      workspaceReadiness: false,
      workspaceIsolation: true,
      constitutionalCompliance: true,
      eklsGoverned: false,
    };
  }

  return {
    allowed: true,
    reason: "Grand King production workspace Pillow governance passed",
    workspaceOwnership: true,
    productionAuthority: true,
    environmentIntegrity: true,
    workspaceReadiness: true,
    workspaceIsolation: true,
    constitutionalCompliance: true,
    eklsGoverned: true,
  };
}
