/**
 * G2-09 — Commerce plugin capability resolution.
 */

import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import {
  COMMERCE_PLUGIN_LIFECYCLE,
  type CommercePluginCapabilityResolution,
  type CommercePluginLifecyclePhase,
} from "../contracts/commerce-plugin-integration-types.js";
import {
  getCommercePluginRecordById,
  listCommercePluginRecords,
} from "../state/commerce-plugin-state-manager.js";

export function resolveCommercePluginCapabilities(
  context: RegistryLoaderContext,
  pluginId: string,
  lifecyclePhase: CommercePluginLifecyclePhase = "discover",
): CommercePluginCapabilityResolution | undefined {
  void context;
  const record = getCommercePluginRecordById(pluginId);
  if (!record) return undefined;

  return {
    pluginId: record.pluginId,
    resolvedCapabilities: record.supportedCapabilities,
    category: record.category,
    lifecyclePhase,
    policyCompliant: record.dependencies.includes("pol-foundation-commerce-default")
      ? true
      : record.dependencies.length === 0,
    registryBacked: true,
  };
}

export function resolveAllCommercePluginCapabilities(
  context: RegistryLoaderContext = {},
  lifecyclePhase: CommercePluginLifecyclePhase = "discover",
): CommercePluginCapabilityResolution[] {
  void context;
  return listCommercePluginRecords()
    .map((record) => resolveCommercePluginCapabilities(context, record.pluginId, lifecyclePhase))
    .filter((entry): entry is CommercePluginCapabilityResolution => Boolean(entry));
}

export function listSupportedCommercePluginLifecyclePhases(): readonly CommercePluginLifecyclePhase[] {
  return COMMERCE_PLUGIN_LIFECYCLE;
}
