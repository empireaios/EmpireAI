/**
 * G2-06 — Logistics capability bridge for Business Engines (no embedded business logic).
 */

import type { CommerceEngineModule } from "../../../../registry/types/commerce-registry-types.js";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import type { LogisticsEngineCapabilityEnvelope } from "../contracts/logistics-integration-types.js";
import { discoverLogisticsProviders } from "./logistics-integration-service.js";
import { resolveAllLogisticsCapabilities } from "../registry/logistics-capability-resolver.js";

const LOGISTICS_ENGINE_BINDINGS: readonly CommerceEngineModule[] = [
  "marketplace-infrastructure-engine",
  "supplier-intelligence-engine",
  "storefront-assembly-engine",
  "analytics-intelligence-engine",
];

const LOGISTICS_CONSUMER_BINDINGS = ["logistics-engine", "business-automation"] as const;

export function listLogisticsEngineBindings(): readonly CommerceEngineModule[] {
  return LOGISTICS_ENGINE_BINDINGS;
}

export function listLogisticsConsumerBindings(): readonly string[] {
  return LOGISTICS_CONSUMER_BINDINGS;
}

export function provideLogisticsCapabilityToConsumer(
  context: RegistryLoaderContext,
  consumerId: string,
  providerId?: string,
): LogisticsEngineCapabilityEnvelope[] {
  const allowedConsumers = [
    ...LOGISTICS_ENGINE_BINDINGS,
    ...LOGISTICS_CONSUMER_BINDINGS,
  ] as readonly string[];

  if (!allowedConsumers.includes(consumerId)) {
    return [];
  }

  const discovery = discoverLogisticsProviders(context);
  const capabilities = resolveAllLogisticsCapabilities(context);
  const targets = providerId
    ? discovery.providers.filter((entry) => entry.providerId === providerId)
    : discovery.providers;

  return targets.map((provider) => {
    const resolved = capabilities.find((entry) => entry.providerId === provider.providerId);
    return {
      consumerId,
      providerId: provider.providerId,
      capabilityIds: provider.capabilities.map((capability) => `REG-LOGISTICS:${capability}`),
      domainCapabilities: resolved?.resolvedCapabilities ?? [],
      discoverySource: "RegistryLoader:logistics-engine-bridge" as const,
    };
  });
}

export function provideLogisticsCapabilityToEngine(
  context: RegistryLoaderContext,
  engineModule: CommerceEngineModule,
  providerId?: string,
): LogisticsEngineCapabilityEnvelope[] {
  return provideLogisticsCapabilityToConsumer(context, engineModule, providerId);
}

export function provideLogisticsCapabilityToAllConsumers(
  context: RegistryLoaderContext,
): LogisticsEngineCapabilityEnvelope[] {
  const consumers = [...LOGISTICS_ENGINE_BINDINGS, ...LOGISTICS_CONSUMER_BINDINGS];
  return consumers.flatMap((consumerId) => provideLogisticsCapabilityToConsumer(context, consumerId));
}
