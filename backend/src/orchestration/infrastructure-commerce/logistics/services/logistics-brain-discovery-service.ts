/**
 * G2-06 — Brain logistics capability discovery (RegistryLoader only — never bypasses Brain path).
 */

import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import {
  LOGISTICS_DOMAIN_CAPABILITIES,
  type LogisticsBrainCapabilityDescriptor,
} from "../contracts/logistics-integration-types.js";
import { discoverLogisticsProviders } from "./logistics-integration-service.js";
import { resolveAllLogisticsCapabilities } from "../registry/logistics-capability-resolver.js";

export function discoverLogisticsCapabilitiesForBrain(
  context: RegistryLoaderContext,
): LogisticsBrainCapabilityDescriptor[] {
  const discovery = discoverLogisticsProviders(context);
  const capabilityMap = new Map(
    resolveAllLogisticsCapabilities(context).map((entry) => [entry.providerId, entry]),
  );

  return discovery.providers.map((provider) => {
    const resolved = capabilityMap.get(provider.providerId);
    return {
      providerId: provider.providerId,
      capabilities: provider.capabilities,
      domainCapabilities: resolved?.resolvedCapabilities ?? [],
      shippingServices: provider.shippingServices.filter((service) => service.supported),
      discoverySource: "RegistryLoader:REG-LOGISTICS" as const,
    };
  });
}

export function listLogisticsBrainDomainCapabilities(): readonly string[] {
  return LOGISTICS_DOMAIN_CAPABILITIES;
}
