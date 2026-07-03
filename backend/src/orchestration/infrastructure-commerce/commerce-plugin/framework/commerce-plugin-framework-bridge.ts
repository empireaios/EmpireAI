/**
 * G2-09 — EmpireAI Plugin Framework bridge (exclusive registration path).
 * Commerce consumes the framework — never owns it.
 */

import { getRegistryLoader } from "../../../../registry/registry-loader.js";
import type { RegistryPluginKind } from "../../../../registry/types/plugin-manifest.js";
import {
  COMMERCE_PLUGIN_CATEGORY_TO_KIND,
  type CommercePluginKind,
  type CommercePluginRegistrationManifest,
} from "../contracts/commerce-plugin-integration-types.js";
import { parseCommercePluginSlotConfiguration } from "../validation/commerce-plugin-contract-validator.js";
import { getCommercePluginSlotById } from "../data/commerce-plugin-slot-store.js";

export const COMMERCE_PLUGIN_FRAMEWORK_SOURCE = "EmpireAIPluginFramework:ea-003" as const;

export function isCommercePluginKind(kind: string): kind is CommercePluginKind {
  return (Object.values(COMMERCE_PLUGIN_CATEGORY_TO_KIND) as string[]).includes(kind);
}

export function listCommercePluginsFromFramework(): ReturnType<
  typeof getRegistryLoader
>["listRegisteredPlugins"] extends () => infer R
  ? R
  : never {
  return getRegistryLoader()
    .listRegisteredPlugins()
    .filter((manifest) => isCommercePluginKind(manifest.kind));
}

export function registerCommercePluginThroughFramework(
  manifest: CommercePluginRegistrationManifest,
): { accepted: boolean; pluginId: string; message: string; frameworkSource: typeof COMMERCE_PLUGIN_FRAMEWORK_SOURCE } {
  const slot = getCommercePluginSlotById(manifest.slotId);
  if (!slot) {
    return {
      accepted: false,
      pluginId: manifest.pluginId,
      message: `Unknown commerce plugin slot: ${manifest.slotId}`,
      frameworkSource: COMMERCE_PLUGIN_FRAMEWORK_SOURCE,
    };
  }

  const slotConfig = parseCommercePluginSlotConfiguration(slot);
  const kind = COMMERCE_PLUGIN_CATEGORY_TO_KIND[manifest.category] as RegistryPluginKind;

  const result = getRegistryLoader().registerPlugin({
    pluginId: manifest.pluginId,
    kind,
    targetRegistryId: slotConfig.registryRef.registryId as Parameters<
      ReturnType<typeof getRegistryLoader>["registerPlugin"]
    >[0]["targetRegistryId"],
    tier: "platform_catalog",
    version: manifest.pluginVersion,
    description: manifest.pluginName,
    extensions: {
      ...manifest.extensions,
      slotId: manifest.slotId,
      category: manifest.category,
      provenance: manifest.provenance,
      pluginOwner: manifest.pluginOwner,
      supportedCapabilities: manifest.supportedCapabilities,
      commercePluginIntegrationVersion: "g2-09-v1",
    },
  });

  return { ...result, frameworkSource: COMMERCE_PLUGIN_FRAMEWORK_SOURCE };
}
