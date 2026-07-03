/**
 * G8-09 — Identity plugin capability resolver (registry-driven).
 */

import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import { resolveAllConnectionProviders } from "../../connection-registry/registry/connection-registry-resolver.js";
import type { IdentityPluginRecord } from "../contracts/identity-plugin-types.js";
import { resolveIdentityPluginRegistryPolicy } from "./identity-plugin-registry-policy-resolver.js";

export function resolveIdentityPluginProviderCoverage(
  record: IdentityPluginRecord,
  context: RegistryLoaderContext = {},
): string[] {
  const providers = new Set<string>(record.supportedProviders);

  const policy = resolveIdentityPluginRegistryPolicy({
    pluginId: record.pluginId,
    category: record.pluginCategory,
    registryReferences: record.registryReferences,
    context: { ...context, workspaceId: record.workspaceId },
  });

  for (const provider of resolveAllConnectionProviders({ workspaceId: record.workspaceId, ...context })) {
    if (policy.connectionProviderIds.includes(provider.providerId)) {
      providers.add(provider.providerId);
    }
  }

  for (const providerId of record.supportedProviders) {
    if (policy.bindingIds.length === 0 || policy.connectionProviderIds.includes(providerId)) {
      providers.add(providerId);
    }
  }

  return [...providers];
}

export function resolveIdentityPluginCapabilities(
  record: IdentityPluginRecord,
  context: RegistryLoaderContext = {},
): string[] {
  const policy = resolveIdentityPluginRegistryPolicy({
    pluginId: record.pluginId,
    category: record.pluginCategory,
    registryReferences: record.registryReferences,
    context: { ...context, workspaceId: record.workspaceId },
  });

  const capabilities = new Set<string>(record.capabilities);
  for (const bindingId of policy.bindingIds) {
    capabilities.add(`registry:${bindingId}`);
  }

  return [...capabilities];
}

export function listIdentityPluginCapabilitiesForWorkspace(input: {
  records: IdentityPluginRecord[];
  workspaceId: string;
}): string[] {
  const capabilities = new Set<string>();
  for (const record of input.records) {
    if (record.workspaceId !== input.workspaceId) continue;
    if (record.status !== "enabled" && record.status !== "loaded") continue;
    for (const capability of resolveIdentityPluginCapabilities(record)) {
      capabilities.add(capability);
    }
  }
  return [...capabilities];
}
