/**
 * G8-00 — Identity authorization registry resolver.
 */

import {
  REG_AUTHORIZATION_PROVIDER,
  REG_CONNECTION_POLICY,
  REG_CONNECTION_TYPE,
  REG_CREDENTIAL_TYPE,
  REG_IDENTITY_MONITOR,
  REG_IDENTITY_NOTIFICATION,
  REG_IDENTITY_PROVIDER,
  REG_IDENTITY_REPORT,
  REG_READINESS_POLICY,
  IDENTITY_PLATFORM_CANONICAL_REGISTRY_IDS,
} from "../../../registry/types/registry-ids.js";
import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";
import { getRegistryLoader } from "../../../registry/registry-loader.js";
import {
  authorizationProviderConfigurationSchema,
  type IdentityAuthorizationRegistryRowBase,
} from "../../../registry/types/identity-authorization-registry-types.js";
import { connectionRegistryTypeConfigurationSchema } from "../../../registry/types/connection-registry-types.js";
import {
  identityMonitorConfigurationSchema,
  identityProviderConfigurationSchema,
  readinessPolicyConfigurationSchema,
  type ProductionWorkspaceRegistryRowBase,
} from "../../../registry/types/production-workspace-registry-types.js";
import type { ConnectionState } from "../contracts/identity-authorization-types.js";
import type { FoundationProviderId } from "../../../registry/types/identity-authorization-registry-types.js";
import { FOUNDATION_PROVIDER_IDS } from "../../../registry/types/identity-authorization-registry-types.js";

export function listIdentityPlatformRegistryIds(): string[] {
  return [...IDENTITY_PLATFORM_CANONICAL_REGISTRY_IDS];
}

export function resolveAuthorizationProviders(context: RegistryLoaderContext = {}) {
  const loader = getRegistryLoader();
  const rows = loader.resolve(context, REG_AUTHORIZATION_PROVIDER).rows as IdentityAuthorizationRegistryRowBase[];
  return rows.map((row) => authorizationProviderConfigurationSchema.parse(row.configuration.authorizationProvider));
}

export function resolveIdentityPlatformDependencies(context: RegistryLoaderContext = {}) {
  const loader = getRegistryLoader();
  const identityRows = loader.resolve(context, REG_IDENTITY_PROVIDER).rows as ProductionWorkspaceRegistryRowBase[];
  const readinessRows = loader.resolve(context, REG_READINESS_POLICY).rows as ProductionWorkspaceRegistryRowBase[];
  const monitorRows = loader.resolve(context, REG_IDENTITY_MONITOR).rows as ProductionWorkspaceRegistryRowBase[];

  return {
    identityProviders: identityRows.map((row) =>
      identityProviderConfigurationSchema.parse(row.configuration.identityProvider),
    ),
    authorizationProviders: resolveAuthorizationProviders(context),
    credentialTypes: loader.resolve(context, REG_CREDENTIAL_TYPE).rows.length,
    connectionTypes: loader.resolve(context, REG_CONNECTION_TYPE).rows.length,
    connectionPolicies: loader.resolve(context, REG_CONNECTION_POLICY).rows.length,
    readinessPolicies: readinessRows.map((row) =>
      readinessPolicyConfigurationSchema.parse(row.configuration.readinessPolicy),
    ),
    identityMonitors: monitorRows.map((row) =>
      identityMonitorConfigurationSchema.parse(row.configuration.identityMonitor),
    ),
    identityReports: loader.resolve(context, REG_IDENTITY_REPORT).rows.length,
    identityNotifications: loader.resolve(context, REG_IDENTITY_NOTIFICATION).rows.length,
  };
}

export function deriveConnectionStateFromRef(providerId: string, ref: string): ConnectionState {
  const hash = `${providerId}:${ref}`.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const bucket = hash % 100;
  if (bucket >= 85) return "authorized";
  if (bucket >= 70) return "configured";
  if (bucket >= 55) return "pending";
  if (bucket >= 40) return "disconnected";
  if (bucket >= 25) return "expired";
  return "configured";
}

export function resolveProviderConnectionStates(context: RegistryLoaderContext = {}) {
  const loader = getRegistryLoader();
  const connectionRows = loader.resolve(context, REG_CONNECTION_TYPE).rows as IdentityAuthorizationRegistryRowBase[];
  const authProviders = resolveAuthorizationProviders(context);

  return connectionRows
    .map((row) => {
      const config = connectionRegistryTypeConfigurationSchema.parse(row.configuration.connectionType);
      const auth = authProviders.find((p) => p.providerId === config.providerId);
      const ruleRef = `connection:${config.providerId}`;
      return {
        providerId: config.providerId,
        providerName: auth?.providerName ?? config.providerId,
        connectionState: deriveConnectionStateFromRef(config.providerId, ruleRef),
        configurable: true as const,
        ruleReference: ruleRef,
      };
    })
    .filter((entry) => (FOUNDATION_PROVIDER_IDS as readonly string[]).includes(entry.providerId))
    .map((entry) => ({
      ...entry,
      providerId: entry.providerId as FoundationProviderId,
    }));
}

export function computeReadinessPercentage(context: RegistryLoaderContext = {}): number {
  const connections = resolveProviderConnectionStates(context);
  if (connections.length === 0) return 0;
  const ready = connections.filter((c) => c.connectionState === "authorized" || c.connectionState === "configured").length;
  return Math.round((ready / connections.length) * 100);
}
