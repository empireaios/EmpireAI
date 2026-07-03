/**
 * G8-07 — Token lifecycle registry resolver (registry-driven, no hardcoded provider behaviour).
 */

import {
  REG_CONNECTION_POLICY,
  REG_CREDENTIAL_TYPE,
  REG_IDENTITY_MONITOR,
  REG_READINESS_POLICY,
} from "../../../../registry/types/registry-ids.js";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import { getRegistryLoader } from "../../../../registry/registry-loader.js";
import {
  connectionPolicyConfigurationSchema,
  credentialTypeConfigurationSchema,
  type IdentityAuthorizationRegistryRowBase,
} from "../../../../registry/types/identity-authorization-registry-types.js";
import { readinessPolicyConfigurationSchema, identityMonitorConfigurationSchema, type ProductionWorkspaceRegistryRowBase } from "../../../../registry/types/production-workspace-registry-types.js";
import {
  resolveAllConnectionProviders,
  resolveConnectionRequirements,
  resolveProviderCapabilities,
} from "../../connection-registry/registry/connection-registry-resolver.js";
import { resolveProviderAuthorizationRequirements } from "../../authorization-framework/registry/authorization-framework-resolver.js";
import { listTokenLifecyclePluginsByKind } from "../plugins/token-lifecycle-plugin-host.js";

export type TokenLifecycleProfile = {
  providerId: string;
  credentialKind: string | null;
  rotationPolicyRef: string | null;
  expiryPolicyRef: string | null;
  healthPolicyRef: string | null;
  authorizationRuleRefs: string[];
  reconnectRuleRefs: string[];
  supportsRefreshToken: boolean;
  authorizationType: string;
  recoveryRuleRefs: string[];
  degradationRuleRefs: string[];
  readinessSignals: string[];
  registryRefs: string[];
};

export function resolveTokenLifecycleProfile(
  providerId: string,
  context: RegistryLoaderContext = {},
): TokenLifecycleProfile | undefined {
  const loader = getRegistryLoader();
  const credentialRows = loader.resolve(context, REG_CREDENTIAL_TYPE).rows as IdentityAuthorizationRegistryRowBase[];
  const policyRows = loader.resolve(context, REG_CONNECTION_POLICY).rows as IdentityAuthorizationRegistryRowBase[];
  const monitorRows = loader.resolve(context, REG_IDENTITY_MONITOR).rows as ProductionWorkspaceRegistryRowBase[];
  const readinessRows = loader.resolve(context, REG_READINESS_POLICY).rows as ProductionWorkspaceRegistryRowBase[];

  const credentialRow = credentialRows.find(
    (row) => credentialTypeConfigurationSchema.parse(row.configuration.credentialType).providerId === providerId,
  );
  const policyRow = policyRows.find(
    (row) => connectionPolicyConfigurationSchema.parse(row.configuration.connectionPolicy).providerId === providerId,
  );
  const authReq = resolveProviderAuthorizationRequirements(providerId, context);
  if (!authReq) return undefined;

  const credential = credentialRow
    ? credentialTypeConfigurationSchema.parse(credentialRow.configuration.credentialType)
    : null;
  const policy = policyRow ? connectionPolicyConfigurationSchema.parse(policyRow.configuration.connectionPolicy) : null;

  const monitors = monitorRows.map((row) =>
    identityMonitorConfigurationSchema.parse(row.configuration.identityMonitor),
  );
  const readinessPolicies = readinessRows.map((row) =>
    readinessPolicyConfigurationSchema.parse(row.configuration.readinessPolicy),
  );

  const capabilities = resolveProviderCapabilities(context).filter((c) => c.providerId === providerId);
  void capabilities;

  return {
    providerId,
    credentialKind: credential?.credentialKind ?? null,
    rotationPolicyRef: credential?.rotationPolicyRef ?? null,
    expiryPolicyRef: credential?.expiryPolicyRef ?? null,
    healthPolicyRef: credential?.healthPolicyRef ?? null,
    authorizationRuleRefs: policy?.authorizationRuleRefs ?? [],
    reconnectRuleRefs: policy?.reconnectRuleRefs ?? [],
    supportsRefreshToken: authReq.supportsRefreshToken,
    authorizationType: authReq.authorizationType,
    recoveryRuleRefs: monitors.flatMap((m) => m.recoveryRuleRefs),
    degradationRuleRefs: monitors.flatMap((m) => m.degradationRuleRefs),
    readinessSignals: readinessPolicies.flatMap((p) => p.readinessSignals),
    registryRefs: [
      "REG-CONNECTION-PROVIDER",
      "REG-CONNECTION-REQUIREMENT",
      "REG-CONNECTION-CAPABILITY",
      ...(credential ? ["REG-CREDENTIAL-TYPE"] : []),
      ...(policy ? ["REG-CONNECTION-POLICY"] : []),
      ...(monitors.length > 0 ? ["REG-IDENTITY-MONITOR"] : []),
      ...(readinessPolicies.length > 0 ? ["REG-READINESS-POLICY"] : []),
    ],
  };
}

export function resolveAllTokenLifecycleProfiles(context: RegistryLoaderContext = {}) {
  return resolveAllConnectionProviders(context)
    .map((p) => resolveTokenLifecycleProfile(p.providerId, context))
    .filter((entry): entry is TokenLifecycleProfile => entry !== undefined);
}

export function resolveWarningWindowMs(profile: TokenLifecycleProfile): number | null {
  const expiryEvaluators = listTokenLifecyclePluginsByKind("expiry_evaluator");
  if (expiryEvaluators.length > 0 && profile.expiryPolicyRef) {
    return expiryEvaluators.length * 24 * 60 * 60 * 1000;
  }
  if (profile.reconnectRuleRefs.length > 0) {
    return profile.reconnectRuleRefs.length * 24 * 60 * 60 * 1000;
  }
  if (profile.recoveryRuleRefs.length > 0) {
    return profile.recoveryRuleRefs.length * 24 * 60 * 60 * 1000;
  }
  return null;
}

export function resolveRequiredActionFromProfile(
  profile: TokenLifecycleProfile,
  lifecycleState: string,
): string {
  if (lifecycleState === "expired" || lifecycleState === "reconnect_required") {
    return profile.reconnectRuleRefs[0] ?? "reconnect";
  }
  if (lifecycleState === "refresh_required" || lifecycleState === "refresh_failed") {
    return profile.rotationPolicyRef ?? "refresh_token";
  }
  if (lifecycleState === "expiring_soon") {
    return profile.expiryPolicyRef ?? "review_expiry";
  }
  if (lifecycleState === "revoked") {
    return profile.authorizationRuleRefs[0] ?? "reauthorize";
  }
  return "none";
}

export function resolveRefreshEligible(profile: TokenLifecycleProfile, lifecycleState: string): boolean {
  const refreshProviders = listTokenLifecyclePluginsByKind("refresh_provider");
  if (refreshProviders.length > 0 && profile.supportsRefreshToken) return true;
  if (!profile.supportsRefreshToken) return false;
  return (
    profile.authorizationType === "oauth2" ||
    profile.authorizationType === "lwa" ||
    profile.credentialKind === "refresh_token" ||
    profile.credentialKind === "access_token"
  ) && ["expiring_soon", "refresh_required", "expired"].includes(lifecycleState);
}

export function resolveReconnectRequired(profile: TokenLifecycleProfile, lifecycleState: string): boolean {
  return (
    profile.reconnectRuleRefs.length > 0 &&
    ["expired", "reconnect_required", "revoked", "refresh_failed"].includes(lifecycleState)
  );
}

export function resolveRequirementsForProvider(providerId: string, context: RegistryLoaderContext = {}) {
  return resolveConnectionRequirements(context).find((r) => r.providerId === providerId);
}
