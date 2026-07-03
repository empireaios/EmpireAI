/**
 * G8-06 — Operational Readiness Engine Pillow governance.
 */

import { enforceEklsAccess } from "../../../pillow/ekls/services/ekls-governance-gateway.js";
import { resolveAllConnectionProviders } from "../../connection-registry/registry/connection-registry-resolver.js";

export type ReadinessPillowContext = {
  actorId: string;
  workspaceId: string;
  ownerId: string;
  accountHolderId?: string;
  providerId?: string;
  operation: "evaluate" | "overview" | "blockers" | "recommendations";
  pillowGovernance: true;
};

export type ReadinessPillowResult = {
  allowed: boolean;
  reason: string;
  evaluationAuthority: boolean;
  workspaceIsolation: boolean;
  accountHolderBoundary: boolean;
  providerVisibility: boolean;
  connectionVisibility: boolean;
  businessOperationEligibility: boolean;
  eklsGoverned: boolean;
};

function deny(reason: string): ReadinessPillowResult {
  return {
    allowed: false,
    reason,
    evaluationAuthority: false,
    workspaceIsolation: false,
    accountHolderBoundary: false,
    providerVisibility: false,
    connectionVisibility: false,
    businessOperationEligibility: false,
    eklsGoverned: false,
  };
}

export function validateReadinessPillowGovernance(context: ReadinessPillowContext): ReadinessPillowResult {
  if (!context.pillowGovernance) {
    return deny("Pillow governance required — no readiness bypass");
  }
  if (!context.actorId?.trim() || !context.workspaceId?.trim()) {
    return deny("actorId and workspaceId are required");
  }
  if (context.ownerId !== "grand-king" && context.operation !== "overview") {
    return deny("Workspace ownership validation failed");
  }

  let providerVisibility = true;
  if (context.providerId) {
    const providers = resolveAllConnectionProviders({ workspaceId: context.workspaceId });
    providerVisibility = providers.some((p) => p.providerId === context.providerId);
    if (!providerVisibility) {
      return {
        ...deny(`Provider visibility boundary — ${context.providerId}`),
        workspaceIsolation: true,
        evaluationAuthority: true,
        accountHolderBoundary: !!context.accountHolderId,
      };
    }
  }

  const ekls = enforceEklsAccess(
    {
      pillowGovernance: true,
      actorId: context.actorId,
      workspaceId: context.workspaceId,
      consumerChannel: "operational-readiness-engine",
      operation: "store",
    },
    context.workspaceId,
  );

  if (!ekls.allowed) {
    return {
      allowed: false,
      reason: ekls.reason,
      evaluationAuthority: true,
      workspaceIsolation: true,
      accountHolderBoundary: !!context.accountHolderId,
      providerVisibility,
      connectionVisibility: true,
      businessOperationEligibility: true,
      eklsGoverned: false,
    };
  }

  return {
    allowed: true,
    reason: "Readiness Pillow governance passed",
    evaluationAuthority: true,
    workspaceIsolation: true,
    accountHolderBoundary: true,
    providerVisibility,
    connectionVisibility: true,
    businessOperationEligibility: true,
    eklsGoverned: true,
  };
}
