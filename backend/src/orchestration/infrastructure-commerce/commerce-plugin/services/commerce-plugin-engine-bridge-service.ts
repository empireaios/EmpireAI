/**
 * G2-09 — Business Engine extension bridge via commerce plugins (coreModified: false).
 */

import type { CommerceEngineModule } from "../../../../registry/types/commerce-registry-types.js";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import type {
  CommercePluginCategory,
  CommercePluginEngineExtensionEnvelope,
} from "../contracts/commerce-plugin-integration-types.js";
import { listCommercePluginRecords } from "../state/commerce-plugin-state-manager.js";

const CATEGORY_ENGINE_BINDINGS: Record<CommercePluginCategory, CommerceEngineModule[]> = {
  marketplace_plugins: ["marketplace-infrastructure-engine"],
  supplier_plugins: ["supplier-intelligence-engine"],
  storefront_plugins: ["storefront-assembly-engine"],
  payment_plugins: ["live-payment-engine"],
  logistics_plugins: ["order-execution-bridge"],
  analytics_plugins: ["analytics-intelligence-engine"],
  commerce_workflow_plugins: ["order-execution-bridge"],
  commerce_validation_plugins: ["marketplace-infrastructure-engine", "live-payment-engine"],
  commerce_monitoring_plugins: ["analytics-intelligence-engine"],
  future_commerce_plugins: ["marketplace-infrastructure-engine"],
};

export function listCommercePluginEngineBindings(
  category?: CommercePluginCategory,
): CommerceEngineModule[] {
  if (category) {
    return [...CATEGORY_ENGINE_BINDINGS[category]];
  }
  return [...new Set(Object.values(CATEGORY_ENGINE_BINDINGS).flat())];
}

export function provideCommercePluginExtensionsToEngine(
  context: RegistryLoaderContext,
  engineId: CommerceEngineModule,
  pluginId?: string,
): CommercePluginEngineExtensionEnvelope[] {
  void context;
  const records = listCommercePluginRecords().filter((record) => {
    if (pluginId && record.pluginId !== pluginId) return false;
    if (!record.frameworkRegistered) return false;
    const engines = CATEGORY_ENGINE_BINDINGS[record.category];
    return engines.includes(engineId);
  });

  return records.map((record) => ({
    engineId,
    pluginId: record.pluginId,
    category: record.category,
    capabilityIds: record.supportedCapabilities.map(
      (capability) => `${record.registryReferences[0]?.registryId ?? "REG-COMMERCE-POLICY"}:${capability}`,
    ),
    coreModified: false as const,
    discoverySource: "EmpireAIPluginFramework:commerce-plugin-engine-bridge" as const,
  }));
}

export function provideCommercePluginExtensionsToAllEngines(
  context: RegistryLoaderContext,
): CommercePluginEngineExtensionEnvelope[] {
  const engines = listCommercePluginEngineBindings();
  return engines.flatMap((engineId) => provideCommercePluginExtensionsToEngine(context, engineId));
}

export function provideAdvertisingEnginePluginExtension(
  context: RegistryLoaderContext,
  pluginId?: string,
): CommercePluginEngineExtensionEnvelope[] {
  return provideCommercePluginExtensionsToEngine(
    context,
    "advertising-intelligence-engine",
    pluginId,
  );
}
