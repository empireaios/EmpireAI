/**
 * G8-04 — Connection health Pillow governance.
 */

import { enforceEklsAccess } from "../../../pillow/ekls/services/ekls-governance-gateway.js";
import { resolveProviderMonitoringProfile } from "../registry/connection-health-resolver.js";

export type ConnectionHealthPillowContext = {
  actorId: string;
  workspaceId: string;
  ownerId: string;
  accountHolderId?: string;
  providerId?: string;
  operation: "check" | "list" | "summary" | "matrix" | "attention";
  pillowGovernance: true;
};

export type ConnectionHealthPillowResult = {
  allowed: boolean;
  reason: string;
  workspaceOwnership: boolean;
  accountHolderAuthority: boolean;
  providerEligibility: boolean;
  monitoringPermission: boolean;
  credentialVisibilityBoundary: boolean;
  healthCheckAuthority: boolean;
  eklsGoverned: boolean;
};

function deny(reason: string): ConnectionHealthPillowResult {
  return {
    allowed: false,
    reason,
    workspaceOwnership: false,
    accountHolderAuthority: false,
    providerEligibility: false,
    monitoringPermission: false,
    credentialVisibilityBoundary: false,
    healthCheckAuthority: false,
    eklsGoverned: false,
  };
}

export function validateConnectionHealthPillowGovernance(
  context: ConnectionHealthPillowContext,
): ConnectionHealthPillowResult {
  if (!context.pillowGovernance) {
    return deny("Pillow governance required — no connection health bypass");
  }
  if (!context.actorId?.trim() || !context.workspaceId?.trim()) {
    return deny("actorId and workspaceId are required");
  }
  if (context.ownerId !== "grand-king" && context.operation !== "list") {
    return deny("Workspace ownership validation failed");
  }

  let providerEligibility = true;
  if (context.providerId) {
    const profile = resolveProviderMonitoringProfile(context.providerId, {
      workspaceId: context.workspaceId,
    });
    providerEligibility = profile !== undefined;
    if (!providerEligibility) {
      return {
        ...deny(`Provider eligibility failed — ${context.providerId}`),
        workspaceOwnership: true,
        accountHolderAuthority: !!context.accountHolderId,
        monitoringPermission: true,
        credentialVisibilityBoundary: true,
      };
    }
  }

  const ekls = enforceEklsAccess(
    {
      pillowGovernance: true,
      actorId: context.actorId,
      workspaceId: context.workspaceId,
      consumerChannel: "connection-health-monitoring",
      operation: "store",
    },
    context.workspaceId,
  );

  if (!ekls.allowed) {
    return {
      allowed: false,
      reason: ekls.reason,
      workspaceOwnership: true,
      accountHolderAuthority: !!context.accountHolderId,
      providerEligibility,
      monitoringPermission: true,
      credentialVisibilityBoundary: true,
      healthCheckAuthority: true,
      eklsGoverned: false,
    };
  }

  return {
    allowed: true,
    reason: "Connection health Pillow governance passed",
    workspaceOwnership: true,
    accountHolderAuthority: true,
    providerEligibility,
    monitoringPermission: true,
    credentialVisibilityBoundary: true,
    healthCheckAuthority: true,
    eklsGoverned: true,
  };
}
