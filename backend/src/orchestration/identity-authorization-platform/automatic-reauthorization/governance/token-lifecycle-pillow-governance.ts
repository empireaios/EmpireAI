/**
 * G8-07 — Token lifecycle Pillow governance.
 */

import { enforceEklsAccess } from "../../../pillow/ekls/services/ekls-governance-gateway.js";
import { resolveAllConnectionProviders } from "../../connection-registry/registry/connection-registry-resolver.js";
import { resolveRefreshEligible, resolveTokenLifecycleProfile } from "../registry/token-lifecycle-resolver.js";

export type TokenLifecyclePillowContext = {
  actorId: string;
  workspaceId: string;
  ownerId: string;
  accountHolderId?: string;
  providerId?: string;
  operation: "scan" | "start" | "cancel" | "status" | "refresh" | "summary";
  pillowGovernance: true;
};

export type TokenLifecyclePillowResult = {
  allowed: boolean;
  reason: string;
  reauthorizationAuthority: boolean;
  workspaceIsolation: boolean;
  accountHolderAuthority: boolean;
  credentialVisibility: boolean;
  refreshEligibility: boolean;
  securityPolicy: boolean;
  manualApprovalRequired: boolean;
  eklsGoverned: boolean;
};

function deny(reason: string): TokenLifecyclePillowResult {
  return {
    allowed: false,
    reason,
    reauthorizationAuthority: false,
    workspaceIsolation: false,
    accountHolderAuthority: false,
    credentialVisibility: false,
    refreshEligibility: false,
    securityPolicy: false,
    manualApprovalRequired: false,
    eklsGoverned: false,
  };
}

export function validateTokenLifecyclePillowGovernance(context: TokenLifecyclePillowContext): TokenLifecyclePillowResult {
  if (!context.pillowGovernance) {
    return deny("Pillow governance required — no token lifecycle bypass");
  }
  if (!context.actorId?.trim() || !context.workspaceId?.trim()) {
    return deny("actorId and workspaceId are required");
  }
  if (context.ownerId !== "grand-king" && context.operation !== "summary") {
    return deny("Workspace ownership validation failed");
  }

  let credentialVisibility = true;
  let refreshEligibility = false;
  if (context.providerId) {
    const providers = resolveAllConnectionProviders({ workspaceId: context.workspaceId });
    credentialVisibility = providers.some((p) => p.providerId === context.providerId);
    if (!credentialVisibility) {
      return {
        ...deny(`Credential visibility boundary — ${context.providerId}`),
        workspaceIsolation: true,
        reauthorizationAuthority: true,
        accountHolderAuthority: !!context.accountHolderId,
      };
    }
    const profile = resolveTokenLifecycleProfile(context.providerId, { workspaceId: context.workspaceId });
    if (profile) {
      refreshEligibility = resolveRefreshEligible(profile, "refresh_required");
    }
  }

  const ekls = enforceEklsAccess(
    {
      pillowGovernance: true,
      actorId: context.actorId,
      workspaceId: context.workspaceId,
      consumerChannel: "automatic-reauthorization",
      operation: "store",
    },
    context.workspaceId,
  );

  if (!ekls.allowed) {
    return {
      allowed: false,
      reason: ekls.reason,
      reauthorizationAuthority: true,
      workspaceIsolation: true,
      accountHolderAuthority: !!context.accountHolderId,
      credentialVisibility,
      refreshEligibility,
      securityPolicy: true,
      manualApprovalRequired: refreshEligibility,
      eklsGoverned: false,
    };
  }

  return {
    allowed: true,
    reason: "Token lifecycle Pillow governance passed",
    reauthorizationAuthority: true,
    workspaceIsolation: true,
    accountHolderAuthority: true,
    credentialVisibility,
    refreshEligibility,
    securityPolicy: true,
    manualApprovalRequired: refreshEligibility,
    eklsGoverned: true,
  };
}
