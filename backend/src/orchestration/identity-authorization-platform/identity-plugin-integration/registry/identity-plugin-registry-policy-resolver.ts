/**
 * G8-09 — Registry-driven identity plugin policy resolution.
 */

import {
  REG_AUTHORIZATION_PROVIDER,
  REG_CONNECTION_CAPABILITY,
  REG_CONNECTION_POLICY,
  REG_CONNECTION_PROVIDER,
  REG_CONNECTION_TYPE,
  REG_IDENTITY_MONITOR,
  REG_IDENTITY_PROVIDER,
  REG_READINESS_POLICY,
  type RegistryId,
} from "../../../../registry/types/registry-ids.js";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import { getRegistryLoader } from "../../../../registry/registry-loader.js";
import type { ProductionWorkspaceRegistryRowBase } from "../../../../registry/types/production-workspace-registry-types.js";
import type { ConnectionRegistryRowBase } from "../../../../registry/types/connection-registry-types.js";
import type { IdentityAuthorizationRegistryRowBase } from "../../../../registry/types/identity-authorization-registry-types.js";
import type {
  IdentityPluginCategory,
  ResolvedIdentityPluginPolicy,
} from "../contracts/identity-plugin-types.js";

type RegistryRow = {
  id: string;
  pluginSupport: { allowPluginRegistration: boolean; pluginKind?: string; pluginId?: string };
};

export const IDENTITY_PLUGIN_CATEGORY_TO_TARGET_REGISTRY: Record<IdentityPluginCategory, RegistryId> = {
  identity_provider_plugin: REG_IDENTITY_PROVIDER,
  authorization_provider_plugin: REG_AUTHORIZATION_PROVIDER,
  oauth_strategy_plugin: REG_CONNECTION_PROVIDER,
  credential_handler_plugin: REG_CONNECTION_TYPE,
  vault_backend_plugin: REG_CONNECTION_TYPE,
  health_check_plugin: REG_IDENTITY_MONITOR,
  readiness_rule_plugin: REG_READINESS_POLICY,
  reauthorization_plugin: REG_CONNECTION_POLICY,
  isolation_policy_plugin: REG_CONNECTION_POLICY,
  notification_plugin: REG_CONNECTION_POLICY,
  provider_card_plugin: REG_CONNECTION_PROVIDER,
  future_identity_plugin: REG_CONNECTION_PROVIDER,
};

function matchesReference(rowId: string, references: string[]): boolean {
  return references.includes(rowId);
}

function matchesPluginSupport(row: RegistryRow, pluginId: string, category: IdentityPluginCategory): boolean {
  if (!row.pluginSupport.allowPluginRegistration) return false;
  if (row.pluginSupport.pluginId && row.pluginSupport.pluginId !== pluginId) return false;
  if (row.pluginSupport.pluginKind && row.pluginSupport.pluginKind !== category) return false;
  return true;
}

function resolveRows(context: RegistryLoaderContext, registryId: RegistryId): RegistryRow[] {
  return getRegistryLoader().resolve(context, registryId).rows as RegistryRow[];
}

export function resolveIdentityPluginRegistryPolicy(input: {
  pluginId: string;
  category: IdentityPluginCategory;
  registryReferences: string[];
  context?: RegistryLoaderContext;
}): ResolvedIdentityPluginPolicy {
  const context = input.context ?? {};

  const connectionProviders = resolveRows(context, REG_CONNECTION_PROVIDER) as ProductionWorkspaceRegistryRowBase[];
  const connectionTypes = resolveRows(context, REG_CONNECTION_TYPE) as IdentityAuthorizationRegistryRowBase[];
  const connectionCapabilities = resolveRows(context, REG_CONNECTION_CAPABILITY) as ConnectionRegistryRowBase[];
  const connectionPolicies = resolveRows(context, REG_CONNECTION_POLICY) as IdentityAuthorizationRegistryRowBase[];
  const identityProviders = resolveRows(context, REG_IDENTITY_PROVIDER) as ProductionWorkspaceRegistryRowBase[];
  const authorizationProviders = resolveRows(context, REG_AUTHORIZATION_PROVIDER) as IdentityAuthorizationRegistryRowBase[];
  const identityMonitors = resolveRows(context, REG_IDENTITY_MONITOR) as ProductionWorkspaceRegistryRowBase[];
  const readinessPolicies = resolveRows(context, REG_READINESS_POLICY) as ProductionWorkspaceRegistryRowBase[];

  const filterRows = (rows: RegistryRow[]) =>
    rows
      .filter(
        (row) =>
          matchesReference(row.id, input.registryReferences) ||
          matchesPluginSupport(row, input.pluginId, input.category),
      )
      .map((row) => row.id);

  const connectionProviderIds = filterRows(connectionProviders);
  const connectionTypeIds = filterRows(connectionTypes);
  const connectionCapabilityIds = filterRows(connectionCapabilities);
  const connectionPolicyIds = filterRows(connectionPolicies);
  const identityProviderIds = filterRows(identityProviders);
  const authorizationProviderIds = filterRows(authorizationProviders);
  const identityMonitorIds = filterRows(identityMonitors);
  const readinessPolicyIds = filterRows(readinessPolicies);

  const bindingIds = [
    ...connectionProviderIds,
    ...connectionTypeIds,
    ...connectionCapabilityIds,
    ...connectionPolicyIds,
    ...identityProviderIds,
    ...authorizationProviderIds,
    ...identityMonitorIds,
    ...readinessPolicyIds,
  ];

  const allowed = bindingIds.length > 0 || input.registryReferences.length === 0;

  return {
    pluginId: input.pluginId,
    category: input.category,
    allowed,
    reason:
      bindingIds.length > 0
        ? "Plugin behaviour resolved from identity platform registries"
        : input.registryReferences.length > 0
          ? "No registry rows matched plugin references"
          : "Plugin registered without explicit registry bindings — domain hooks only",
    connectionProviderIds,
    connectionTypeIds,
    connectionCapabilityIds,
    connectionPolicyIds,
    identityProviderIds,
    authorizationProviderIds,
    identityMonitorIds,
    readinessPolicyIds,
    bindingIds,
  };
}

export function previewIdentityPluginRegistryPolicy(input: {
  pluginId: string;
  category: IdentityPluginCategory;
  registryReferences: string[];
  context?: RegistryLoaderContext;
}): ResolvedIdentityPluginPolicy {
  return resolveIdentityPluginRegistryPolicy(input);
}
