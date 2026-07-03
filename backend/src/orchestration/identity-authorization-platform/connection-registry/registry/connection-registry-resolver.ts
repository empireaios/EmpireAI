/**
 * G8-01 — Connection registry resolver.
 */

import {
  REG_CONNECTION_ACCOUNT_HOLDER,
  REG_CONNECTION_CAPABILITY,
  REG_CONNECTION_DEPENDENCY,
  REG_CONNECTION_PERMISSION,
  REG_CONNECTION_PROVIDER,
  REG_CONNECTION_REQUIREMENT,
  REG_CONNECTION_SCOPE,
  REG_CONNECTION_TYPE,
  CONNECTION_REGISTRY_CANONICAL_REGISTRY_IDS,
} from "../../../../registry/types/registry-ids.js";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import { getRegistryLoader } from "../../../../registry/registry-loader.js";
import {
  connectionAccountHolderConfigurationSchema,
  connectionCapabilityConfigurationSchema,
  connectionDependencyConfigurationSchema,
  connectionPermissionConfigurationSchema,
  connectionRegistryProviderConfigurationSchema,
  connectionRegistryTypeConfigurationSchema,
  connectionRequirementConfigurationSchema,
  connectionScopeConfigurationSchema,
  type ConnectionRegistryRowBase,
  type WorkspaceConnectionProfile,
} from "../../../../registry/types/connection-registry-types.js";
import type { ProductionWorkspaceRegistryRowBase } from "../../../../registry/types/production-workspace-registry-types.js";
import type { IdentityAuthorizationRegistryRowBase } from "../../../../registry/types/identity-authorization-registry-types.js";

export function listConnectionRegistryIds(): string[] {
  return [...CONNECTION_REGISTRY_CANONICAL_REGISTRY_IDS];
}

export function resolveConnectionProvider(providerId: string, context: RegistryLoaderContext = {}) {
  const loader = getRegistryLoader();
  const rows = loader.resolve(context, REG_CONNECTION_PROVIDER).rows as ProductionWorkspaceRegistryRowBase[];
  const row = rows.find(
    (entry) =>
      connectionRegistryProviderConfigurationSchema.parse(entry.configuration.connectionProvider).providerId ===
      providerId,
  );
  if (!row) return undefined;
  return connectionRegistryProviderConfigurationSchema.parse(row.configuration.connectionProvider);
}

export function resolveAllConnectionProviders(context: RegistryLoaderContext = {}) {
  const loader = getRegistryLoader();
  const rows = loader.resolve(context, REG_CONNECTION_PROVIDER).rows as ProductionWorkspaceRegistryRowBase[];
  return rows.map((row) =>
    connectionRegistryProviderConfigurationSchema.parse(row.configuration.connectionProvider),
  );
}

export function resolveConnectionRequirements(context: RegistryLoaderContext = {}) {
  const loader = getRegistryLoader();
  const rows = loader.resolve(context, REG_CONNECTION_REQUIREMENT).rows as ConnectionRegistryRowBase[];
  return rows.map((row) => connectionRequirementConfigurationSchema.parse(row.configuration.connectionRequirement));
}

export function resolveProviderCapabilities(context: RegistryLoaderContext = {}) {
  const loader = getRegistryLoader();
  const rows = loader.resolve(context, REG_CONNECTION_CAPABILITY).rows as ConnectionRegistryRowBase[];
  return rows.map((row) => connectionCapabilityConfigurationSchema.parse(row.configuration.connectionCapability));
}

export function resolveConnectionDependencies(context: RegistryLoaderContext = {}) {
  const loader = getRegistryLoader();
  const rows = loader.resolve(context, REG_CONNECTION_DEPENDENCY).rows as ConnectionRegistryRowBase[];
  return rows.map((row) => connectionDependencyConfigurationSchema.parse(row.configuration.connectionDependency));
}

export function resolveConnectionScopes(context: RegistryLoaderContext = {}) {
  const loader = getRegistryLoader();
  const rows = loader.resolve(context, REG_CONNECTION_SCOPE).rows as ConnectionRegistryRowBase[];
  return rows.map((row) => connectionScopeConfigurationSchema.parse(row.configuration.connectionScope));
}

export function resolveConnectionPermissions(context: RegistryLoaderContext = {}) {
  const loader = getRegistryLoader();
  const rows = loader.resolve(context, REG_CONNECTION_PERMISSION).rows as ConnectionRegistryRowBase[];
  return rows.map((row) => connectionPermissionConfigurationSchema.parse(row.configuration.connectionPermission));
}

export function resolveConnectionAccountHolders(context: RegistryLoaderContext = {}) {
  const loader = getRegistryLoader();
  const rows = loader.resolve(context, REG_CONNECTION_ACCOUNT_HOLDER).rows as ConnectionRegistryRowBase[];
  return rows.map((row) =>
    connectionAccountHolderConfigurationSchema.parse(row.configuration.connectionAccountHolder),
  );
}

export function resolveConnectionTypes(context: RegistryLoaderContext = {}) {
  const loader = getRegistryLoader();
  const rows = loader.resolve(context, REG_CONNECTION_TYPE).rows as IdentityAuthorizationRegistryRowBase[];
  return rows.map((row) => connectionRegistryTypeConfigurationSchema.parse(row.configuration.connectionType));
}

export function resolveWorkspaceConnectionProfile(
  input: { workspaceId: string; accountHolderId?: string },
  context: RegistryLoaderContext = {},
): WorkspaceConnectionProfile {
  const ctx = { ...context, workspaceId: input.workspaceId };
  const providers = resolveAllConnectionProviders(ctx);
  const requirements = resolveConnectionRequirements(ctx);
  const capabilities = resolveProviderCapabilities(ctx);
  const dependencies = resolveConnectionDependencies(ctx);
  const connectionTypes = resolveConnectionTypes(ctx);

  return {
    workspaceId: input.workspaceId,
    accountHolderId: input.accountHolderId ?? "grand-king",
    providerCount: providers.length,
    connectionTypeCount: connectionTypes.length,
    requirementCount: requirements.length,
    capabilityCount: capabilities.length,
    dependencyCount: dependencies.length,
    supportedProviders: providers.map((p) => p.providerId),
    generatedAt: new Date().toISOString(),
  };
}
