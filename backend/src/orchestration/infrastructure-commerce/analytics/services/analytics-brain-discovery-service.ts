/**
 * G2-07 — Brain analytics capability discovery (never bypasses Brain path).
 */

import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import {
  ANALYTICS_DOMAIN_CAPABILITIES,
  type AnalyticsBrainCapabilityDescriptor,
} from "../contracts/analytics-integration-types.js";
import { discoverAnalyticsProviders } from "./analytics-integration-service.js";
import { resolveAllAnalyticsCapabilities } from "../registry/analytics-capability-resolver.js";

export function discoverAnalyticsCapabilitiesForBrain(
  context: RegistryLoaderContext,
): AnalyticsBrainCapabilityDescriptor[] {
  const discovery = discoverAnalyticsProviders(context);
  const capabilityMap = new Map(
    resolveAllAnalyticsCapabilities(context).map((entry) => [entry.analyticsId, entry]),
  );

  return discovery.providers.map((provider) => {
    const resolved = capabilityMap.get(provider.analyticsId);
    return {
      analyticsId: provider.analyticsId,
      capabilities: provider.capabilities,
      domainCapabilities: resolved?.resolvedCapabilities ?? [],
      categories: resolved?.categories ?? [],
      discoverySource: "AnalyticsProviderCatalog:dynamic" as const,
    };
  });
}

export function listAnalyticsBrainDomainCapabilities(): readonly string[] {
  return ANALYTICS_DOMAIN_CAPABILITIES;
}
