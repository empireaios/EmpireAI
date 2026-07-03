/**
 * G2-04 — Brain storefront capability discovery (RegistryLoader only — never bypasses Brain path).
 */

import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import {
  STOREFRONT_DOMAIN_CAPABILITIES,
  type StorefrontBrainCapabilityDescriptor,
} from "../contracts/storefront-integration-types.js";
import { discoverStorefronts } from "./storefront-integration-service.js";
import { resolveAllStorefrontCapabilities } from "../registry/storefront-capability-resolver.js";

export function discoverStorefrontCapabilitiesForBrain(
  context: RegistryLoaderContext,
): StorefrontBrainCapabilityDescriptor[] {
  const discovery = discoverStorefronts(context);
  const capabilityMap = new Map(
    resolveAllStorefrontCapabilities(context).map((entry) => [entry.storefrontId, entry]),
  );

  return discovery.storefronts.map((storefront) => {
    const resolved = capabilityMap.get(storefront.storefrontId);
    return {
      storefrontId: storefront.storefrontId,
      capabilities: storefront.capabilities,
      domainCapabilities: resolved?.resolvedCapabilities ?? [],
      publishingCapabilities: storefront.publishingCapabilities,
      discoverySource: "RegistryLoader:REG-STOREFRONT" as const,
    };
  });
}

export function listStorefrontBrainDomainCapabilities(): readonly string[] {
  return STOREFRONT_DOMAIN_CAPABILITIES;
}
