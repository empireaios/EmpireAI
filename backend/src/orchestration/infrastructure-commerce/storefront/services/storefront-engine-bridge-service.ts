/**
 * G2-04 — Storefront capability bridge for Business Engines (no embedded business logic).
 */

import type { CommerceEngineModule } from "../../../../registry/types/commerce-registry-types.js";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import type { StorefrontEngineCapabilityEnvelope } from "../contracts/storefront-integration-types.js";
import { discoverStorefronts } from "./storefront-integration-service.js";
import { resolveAllStorefrontCapabilities } from "../registry/storefront-capability-resolver.js";

const STOREFRONT_ENGINE_BINDINGS: readonly CommerceEngineModule[] = [
  "storefront-assembly-engine",
  "marketplace-infrastructure-engine",
  "supplier-intelligence-engine",
  "advertising-intelligence-engine",
  "analytics-intelligence-engine",
];

export function listStorefrontEngineBindings(): readonly CommerceEngineModule[] {
  return STOREFRONT_ENGINE_BINDINGS;
}

export function provideStorefrontCapabilityToEngine(
  context: RegistryLoaderContext,
  engineModule: CommerceEngineModule,
  storefrontId?: string,
): StorefrontEngineCapabilityEnvelope[] {
  if (!STOREFRONT_ENGINE_BINDINGS.includes(engineModule)) {
    return [];
  }

  const discovery = discoverStorefronts(context);
  const capabilities = resolveAllStorefrontCapabilities(context);
  const targets = storefrontId
    ? discovery.storefronts.filter((entry) => entry.storefrontId === storefrontId)
    : discovery.storefronts;

  return targets.map((storefront) => {
    const resolved = capabilities.find((entry) => entry.storefrontId === storefront.storefrontId);
    return {
      engineModule,
      storefrontId: storefront.storefrontId,
      capabilityIds: storefront.capabilities.map((capability) => `REG-STOREFRONT:${capability}`),
      domainCapabilities: resolved?.resolvedCapabilities ?? [],
      discoverySource: "RegistryLoader:storefront-engine-bridge" as const,
    };
  });
}

export function provideStorefrontCapabilityToAllEngines(
  context: RegistryLoaderContext,
): StorefrontEngineCapabilityEnvelope[] {
  return STOREFRONT_ENGINE_BINDINGS.flatMap((engineModule) =>
    provideStorefrontCapabilityToEngine(context, engineModule),
  );
}
