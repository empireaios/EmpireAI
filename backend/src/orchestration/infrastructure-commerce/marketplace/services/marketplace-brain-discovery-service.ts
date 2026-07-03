/**
 * G2-02 — Brain marketplace capability discovery (RegistryLoader only — never bypasses Brain path).
 */

import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import type { MarketplaceBrainCapabilityDescriptor } from "../contracts/marketplace-integration-types.js";
import { MARKETPLACE_DOMAIN_CAPABILITIES } from "../contracts/marketplace-integration-types.js";
import { discoverMarketplaces } from "./marketplace-integration-service.js";
import { resolveAllMarketplaceCapabilities } from "../registry/marketplace-capability-resolver.js";

export function discoverMarketplaceCapabilitiesForBrain(
  context: RegistryLoaderContext = {},
): MarketplaceBrainCapabilityDescriptor[] {
  const discovery = discoverMarketplaces(context);
  const capabilityMap = new Map(
    resolveAllMarketplaceCapabilities(context).map((entry) => [entry.marketplaceId, entry]),
  );

  return discovery.marketplaces.map((marketplace) => {
    const resolved = capabilityMap.get(marketplace.marketplaceId);
    return {
      marketplaceId: marketplace.marketplaceId,
      capabilities: marketplace.capabilities,
      domainCapabilities: resolved?.resolvedCapabilities ?? [],
      supportedFeatures: marketplace.supportedFeatures,
      discoverySource: "RegistryLoader:REG-MARKETPLACE" as const,
    };
  });
}

export function listMarketplaceBrainDomainCapabilities(): readonly string[] {
  return MARKETPLACE_DOMAIN_CAPABILITIES;
}
