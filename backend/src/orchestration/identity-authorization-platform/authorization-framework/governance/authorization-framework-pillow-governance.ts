/**
 * G8-02 — Authorization framework Pillow governance.
 */

import { AUTHORIZATION_TYPES } from "../contracts/authorization-framework-types.js";
import { enforceEklsAccess } from "../../../pillow/ekls/services/ekls-governance-gateway.js";
import { resolveProviderAuthorizationRequirements } from "../registry/authorization-framework-resolver.js";

export type AuthorizationFrameworkPillowContext = {
  actorId: string;
  workspaceId: string;
  ownerId: string;
  accountHolderId?: string;
  providerId?: string;
  authorizationType?: string;
  requestedScopes?: string[];
  requestedPermissions?: string[];
  operation: "start" | "callback" | "submit" | "validate" | "cancel" | "status" | "requirements";
  pillowGovernance: true;
};

export type AuthorizationFrameworkPillowResult = {
  allowed: boolean;
  reason: string;
  workspaceOwnership: boolean;
  accountHolderAuthority: boolean;
  providerEligibility: boolean;
  scopeBoundary: boolean;
  permissionBoundary: boolean;
  authorizationTypeEligibility: boolean;
  securityPolicy: boolean;
  eklsGoverned: boolean;
};

function deny(reason: string): AuthorizationFrameworkPillowResult {
  return {
    allowed: false,
    reason,
    workspaceOwnership: false,
    accountHolderAuthority: false,
    providerEligibility: false,
    scopeBoundary: false,
    permissionBoundary: false,
    authorizationTypeEligibility: false,
    securityPolicy: false,
    eklsGoverned: false,
  };
}

export function validateAuthorizationFrameworkPillowGovernance(
  context: AuthorizationFrameworkPillowContext,
): AuthorizationFrameworkPillowResult {
  if (!context.pillowGovernance) {
    return deny("Pillow governance required — no authorization bypass");
  }
  if (!context.actorId?.trim() || !context.workspaceId?.trim()) {
    return deny("actorId and workspaceId are required");
  }
  if (context.ownerId !== "grand-king" && context.operation !== "status") {
    return deny("Workspace ownership validation failed");
  }
  if (!context.accountHolderId?.trim() && context.operation !== "requirements") {
    return deny("Account holder authority required");
  }

  let providerEligibility = true;
  let authorizationTypeEligibility = true;
  let scopeBoundary = true;
  let permissionBoundary = true;

  if (context.providerId) {
    const requirements = resolveProviderAuthorizationRequirements(context.providerId, {
      workspaceId: context.workspaceId,
    });
    providerEligibility = requirements !== undefined;
    if (!providerEligibility) {
      return {
        ...deny(`Provider eligibility failed — ${context.providerId} not in registry`),
        workspaceOwnership: true,
        accountHolderAuthority: true,
      };
    }

    if (context.authorizationType) {
      authorizationTypeEligibility = (AUTHORIZATION_TYPES as readonly string[]).includes(context.authorizationType);
      if (!authorizationTypeEligibility) {
        return {
          ...deny(`Authorization type eligibility failed — ${context.authorizationType}`),
          workspaceOwnership: true,
          accountHolderAuthority: true,
          providerEligibility: true,
        };
      }
    }

    if (context.requestedScopes?.length) {
      scopeBoundary = context.requestedScopes.every((scope) =>
        requirements!.requestedScopes.includes(scope) || scope.startsWith(`scope:${context.providerId}`),
      );
    }
    if (context.requestedPermissions?.length) {
      permissionBoundary = context.requestedPermissions.every((perm) =>
        requirements!.requestedPermissions.includes(perm) ||
        perm.startsWith(`permission:${context.providerId}`),
      );
    }
    if (!scopeBoundary || !permissionBoundary) {
      return {
        ...deny("Scope or permission boundary validation failed"),
        workspaceOwnership: true,
        accountHolderAuthority: true,
        providerEligibility: true,
        scopeBoundary,
        permissionBoundary,
        authorizationTypeEligibility,
        securityPolicy: true,
      };
    }
  }

  const ekls = enforceEklsAccess(
    {
      pillowGovernance: true,
      actorId: context.actorId,
      workspaceId: context.workspaceId,
      consumerChannel: "authorization-framework",
      operation: "store",
    },
    context.workspaceId,
  );

  if (!ekls.allowed) {
    return {
      allowed: false,
      reason: ekls.reason,
      workspaceOwnership: true,
      accountHolderAuthority: true,
      providerEligibility,
      scopeBoundary,
      permissionBoundary,
      authorizationTypeEligibility,
      securityPolicy: true,
      eklsGoverned: false,
    };
  }

  return {
    allowed: true,
    reason: "Authorization framework Pillow governance passed",
    workspaceOwnership: true,
    accountHolderAuthority: true,
    providerEligibility,
    scopeBoundary,
    permissionBoundary,
    authorizationTypeEligibility,
    securityPolicy: true,
    eklsGoverned: true,
  };
}
