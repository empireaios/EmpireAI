/**
 * G2-02 — Marketplace capability bridge for Business Engines (no embedded business logic).
 */

import type { CommerceEngineModule } from "../../../../registry/types/commerce-registry-types.js";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import type { MarketplaceEngineCapabilityEnvelope } from "../contracts/marketplace-integration-types.js";
import { discoverMarketplaces } from "./marketplace-integration-service.js";
import { resolveAllMarketplaceCapabilities } from "../registry/marketplace-capability-resolver.js";

const MARKETPLACE_ENGINE_BINDINGS: readonly CommerceEngineModule[] = [
  "marketplace-infrastructure-engine",
  "storefront-assembly-engine",
  "advertising-intelligence-engine",
  "live-payment-engine",
  "order-execution-bridge",
  "analytics-intelligence-engine",
];

export function listMarketplaceEngineBindings(): readonly CommerceEngineModule[] {
  return MARKETPLACE_ENGINE_BINDINGS;
}

export function provideMarketplaceCapabilityToEngine(
  context: RegistryLoaderContext,
  engineModule: CommerceEngineModule,
  marketplaceId?: string,
): MarketplaceEngineCapabilityEnvelope[] {
  if (!MARKETPLACE_ENGINE_BINDINGS.includes(engineModule)) {
    return [];
  }

  const discovery = discoverMarketplaces(context);
  const capabilities = resolveAllMarketplaceCapabilities(context);
  const targets = marketplaceId
    ? discovery.marketplaces.filter((entry) => entry.marketplaceId === marketplaceId)
    : discovery.marketplaces;

  return targets.map((marketplace) => {
    const resolved = capabilities.find((entry) => entry.marketplaceId === marketplace.marketplaceId);
    return {
      engineModule,
      marketplaceId: marketplace.marketplaceId,
      capabilityIds: marketplace.capabilities.map((capability) => `REG-MARKETPLACE:${capability}`),
      domainCapabilities: resolved?.resolvedCapabilities ?? [],
      discoverySource: "RegistryLoader:marketplace-engine-bridge" as const,
    };
  });
}

export function provideMarketplaceCapabilityToAllEngines(
  context: RegistryLoaderContext = {},
): MarketplaceEngineCapabilityEnvelope[] {
  return MARKETPLACE_ENGINE_BINDINGS.flatMap((engineModule) =>
    provideMarketplaceCapabilityToEngine(context, engineModule),
  );
}
