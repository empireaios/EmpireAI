/**
 * G8-02 — Authorization framework registry resolver.
 */

import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import {
  resolveAuthorizationProviders,
} from "../../registry/identity-authorization-registry-resolver.js";
import {
  resolveAllConnectionProviders,
  resolveConnectionPermissions,
  resolveConnectionProvider,
  resolveConnectionRequirements,
  resolveConnectionScopes,
  resolveProviderCapabilities,
} from "../../connection-registry/registry/connection-registry-resolver.js";
import type { AuthorizationType } from "../contracts/authorization-framework-types.js";

export type ProviderAuthorizationRequirements = {
  providerId: string;
  displayName: string;
  authorizationType: AuthorizationType;
  requestedScopes: string[];
  requestedPermissions: string[];
  supportsOAuth: boolean;
  supportsApiKey: boolean;
  supportsRefreshToken: boolean;
  supportsWebhook: boolean;
  governancePolicy: string;
  readinessPolicy: string;
  registryRefs: string[];
};

export function resolveProviderAuthorizationRequirements(
  providerId: string,
  context: RegistryLoaderContext = {},
): ProviderAuthorizationRequirements | undefined {
  const provider = resolveConnectionProvider(providerId, context);
  if (!provider) return undefined;

  const requirement = resolveConnectionRequirements(context).find((r) => r.providerId === providerId);
  const authProvider = resolveAuthorizationProviders(context).find((p) => p.providerId === providerId);

  const authorizationType = (requirement?.authorizationType ?? "future_authorization_type") as AuthorizationType;

  return {
    providerId: provider.providerId,
    displayName: provider.displayName,
    authorizationType,
    requestedScopes: requirement?.requiredScopes ?? provider.supportedScopes,
    requestedPermissions: requirement?.requiredPermissions ?? provider.supportedPermissions,
    supportsOAuth: provider.supportsOAuth,
    supportsApiKey: provider.supportsApiKey,
    supportsRefreshToken: provider.supportsRefreshToken,
    supportsWebhook: provider.supportsWebhook,
    governancePolicy: provider.governancePolicy,
    readinessPolicy: provider.readinessPolicy,
    registryRefs: [
      "REG-CONNECTION-PROVIDER",
      "REG-CONNECTION-REQUIREMENT",
      ...(authProvider ? ["REG-AUTHORIZATION-PROVIDER"] : []),
    ],
  };
}

export function resolveAllProviderAuthorizationRequirements(context: RegistryLoaderContext = {}) {
  return resolveAllConnectionProviders(context)
    .map((p) => resolveProviderAuthorizationRequirements(p.providerId, context))
    .filter((entry): entry is ProviderAuthorizationRequirements => entry !== undefined);
}

export function resolveAuthorizationScopesForProvider(providerId: string, context: RegistryLoaderContext = {}) {
  return resolveConnectionScopes(context).filter((s) => s.providerId === providerId);
}

export function resolveAuthorizationPermissionsForProvider(providerId: string, context: RegistryLoaderContext = {}) {
  return resolveConnectionPermissions(context).filter((p) => p.providerId === providerId);
}

export function resolveAuthorizationCapabilitiesForProvider(providerId: string, context: RegistryLoaderContext = {}) {
  return resolveProviderCapabilities(context).filter((c) => c.providerId === providerId);
}
