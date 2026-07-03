/**
 * G8-02 — Authorization scope and permission validation.
 */

import type { ProviderAuthorizationRequirements } from "../registry/authorization-framework-resolver.js";

export type ScopeValidationResult = {
  valid: boolean;
  grantedScopes: string[];
  missingScopes: string[];
  reason: string;
};

export type PermissionValidationResult = {
  valid: boolean;
  grantedPermissions: string[];
  missingPermissions: string[];
  reason: string;
};

export function validateRequestedScopes(input: {
  requestedScopes: string[];
  grantedScopes: string[];
}): ScopeValidationResult {
  const missingScopes = input.requestedScopes.filter((scope) => !input.grantedScopes.includes(scope));
  return {
    valid: missingScopes.length === 0,
    grantedScopes: input.grantedScopes.filter((s) => input.requestedScopes.includes(s)),
    missingScopes,
    reason: missingScopes.length === 0 ? "All requested scopes granted" : `Missing scopes: ${missingScopes.join(", ")}`,
  };
}

export function validateRequestedPermissions(input: {
  requestedPermissions: string[];
  grantedPermissions: string[];
}): PermissionValidationResult {
  const missingPermissions = input.requestedPermissions.filter((p) => !input.grantedPermissions.includes(p));
  return {
    valid: missingPermissions.length === 0,
    grantedPermissions: input.grantedPermissions.filter((p) => input.requestedPermissions.includes(p)),
    missingPermissions,
    reason:
      missingPermissions.length === 0
        ? "All requested permissions granted"
        : `Missing permissions: ${missingPermissions.join(", ")}`,
  };
}

export function deriveGrantedScopesFromRequirements(
  requirements: ProviderAuthorizationRequirements,
  partial = false,
): string[] {
  if (partial && requirements.requestedScopes.length > 1) {
    return requirements.requestedScopes.slice(0, 1);
  }
  return [...requirements.requestedScopes];
}

export function deriveGrantedPermissionsFromRequirements(
  requirements: ProviderAuthorizationRequirements,
  partial = false,
): string[] {
  if (partial && requirements.requestedPermissions.length > 1) {
    return requirements.requestedPermissions.slice(0, 1);
  }
  return [...requirements.requestedPermissions];
}

export function isAuthorizationTypeEligible(
  authorizationType: string,
  requirements: ProviderAuthorizationRequirements,
): boolean {
  const oauthTypes = new Set(["oauth2", "oauth1", "lwa"]);
  const credentialTypes = new Set(["api_key", "secret_key", "webhook_secret", "manual_upload", "refresh_token"]);
  if (oauthTypes.has(authorizationType)) return requirements.supportsOAuth || authorizationType === "lwa";
  if (credentialTypes.has(authorizationType)) return requirements.supportsApiKey || requirements.supportsWebhook;
  return authorizationType === requirements.authorizationType;
}
