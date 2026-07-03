/**
 * G8-09 — EmpireAI Plugin Framework bridge (exclusive registration path).
 * Identity & Authorization consumes the framework — never owns it.
 */

import { getRegistryLoader } from "../../../../registry/registry-loader.js";
import type { RegistryPluginKind } from "../../../../registry/types/plugin-manifest.js";
import type { RegistryId } from "../../../../registry/types/registry-ids.js";
import {
  IDENTITY_PLUGIN_INTEGRATION_VERSION,
  type IdentityPluginCategory,
  type IdentityPluginManifest,
} from "../contracts/identity-plugin-types.js";

export const IDENTITY_PLUGIN_FRAMEWORK_SOURCE = "EmpireAIPluginFramework:identity-authorization-plugin-integration" as const;

export const IDENTITY_PLUGIN_CATEGORY_TO_KIND: Record<IdentityPluginCategory, RegistryPluginKind> = {
  identity_provider_plugin: "provider",
  authorization_provider_plugin: "provider",
  oauth_strategy_plugin: "engine",
  credential_handler_plugin: "engine",
  vault_backend_plugin: "engine",
  health_check_plugin: "engine",
  readiness_rule_plugin: "policy_pack",
  reauthorization_plugin: "engine",
  isolation_policy_plugin: "policy_pack",
  notification_plugin: "engine",
  provider_card_plugin: "provider",
  future_identity_plugin: "provider",
};

export function registerIdentityPluginThroughFramework(
  manifest: IdentityPluginManifest,
  targetRegistryId: RegistryId,
): { accepted: boolean; pluginId: string; message: string; frameworkSource: typeof IDENTITY_PLUGIN_FRAMEWORK_SOURCE } {
  const kind = IDENTITY_PLUGIN_CATEGORY_TO_KIND[manifest.pluginCategory];

  const result = getRegistryLoader().registerPlugin({
    pluginId: manifest.pluginId,
    kind,
    targetRegistryId,
    tier: "policy_topology",
    version: manifest.pluginVersion,
    description: manifest.pluginName,
    extensions: {
      category: manifest.pluginCategory,
      pluginOwner: manifest.pluginOwner,
      capabilities: manifest.capabilities,
      supportedProviders: manifest.supportedProviders,
      supportedConnectionTypes: manifest.supportedConnectionTypes,
      supportedCredentialTypes: manifest.supportedCredentialTypes,
      requiredPermissions: manifest.requiredPermissions,
      registryReferences: manifest.registryReferences,
      configurationSchema: manifest.configurationSchema,
      healthCheck: manifest.healthCheck,
      compatibilityMatrix: manifest.compatibilityMatrix,
      lifecycleHooks: manifest.lifecycleHooks,
      identityPluginIntegrationVersion: IDENTITY_PLUGIN_INTEGRATION_VERSION,
    },
  });

  return { ...result, frameworkSource: IDENTITY_PLUGIN_FRAMEWORK_SOURCE };
}

export function listIdentityPluginsFromFramework(): ReturnType<
  ReturnType<typeof getRegistryLoader>["listRegisteredPlugins"]
> {
  const identityKinds = new Set(Object.values(IDENTITY_PLUGIN_CATEGORY_TO_KIND));
  return getRegistryLoader()
    .listRegisteredPlugins()
    .filter((entry) => identityKinds.has(entry.kind));
}
