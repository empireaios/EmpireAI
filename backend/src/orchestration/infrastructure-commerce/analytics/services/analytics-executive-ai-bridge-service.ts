/**
 * G2-07 — Executive AI input bridge (data only — no executive reasoning).
 */

import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import {
  EXECUTIVE_AI_CONSUMERS,
  type AnalyticsExecutiveAiInputEnvelope,
  type ExecutiveAiConsumer,
} from "../contracts/analytics-integration-types.js";
import { discoverAnalyticsProviders } from "./analytics-integration-service.js";
import { resolveAllAnalyticsCapabilities } from "../registry/analytics-capability-resolver.js";

export function listExecutiveAiConsumers(): readonly ExecutiveAiConsumer[] {
  return EXECUTIVE_AI_CONSUMERS;
}

export function provideAnalyticsInputToExecutiveAi(
  context: RegistryLoaderContext,
  consumerId: ExecutiveAiConsumer | string,
  analyticsId?: string,
): AnalyticsExecutiveAiInputEnvelope[] {
  if (!EXECUTIVE_AI_CONSUMERS.includes(consumerId as ExecutiveAiConsumer)) {
    return [];
  }

  const discovery = discoverAnalyticsProviders(context);
  const capabilities = resolveAllAnalyticsCapabilities(context);
  const targets = analyticsId
    ? discovery.providers.filter((entry) => entry.analyticsId === analyticsId)
    : discovery.providers;

  return targets.map((provider) => {
    const resolved = capabilities.find((entry) => entry.analyticsId === provider.analyticsId);
    return {
      consumerId,
      analyticsId: provider.analyticsId,
      metricRefs: provider.supportedMetrics.filter((m) => m.supported).map((m) => m.metricRef),
      eventRefs: provider.supportedEvents.filter((e) => e.supported).map((e) => e.eventRef),
      domainCapabilities: resolved?.resolvedCapabilities ?? [],
      dataOnly: true,
      discoverySource: "AnalyticsProviderCatalog:executive-ai-bridge" as const,
    };
  });
}

export function provideAnalyticsInputToAllExecutiveAiConsumers(
  context: RegistryLoaderContext,
): AnalyticsExecutiveAiInputEnvelope[] {
  return EXECUTIVE_AI_CONSUMERS.flatMap((consumerId) =>
    provideAnalyticsInputToExecutiveAi(context, consumerId),
  );
}
