/**
 * G2-07 — Business engine event bridge (receive operational events — no business logic).
 */

import type { CommerceEngineModule } from "../../../../registry/types/commerce-registry-types.js";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import type {
  AnalyticsCategory,
  AnalyticsEngineEventEnvelope,
} from "../contracts/analytics-integration-types.js";
import { discoverAnalyticsProviders } from "./analytics-integration-service.js";
import { validateAnalyticsEventRef } from "../validation/analytics-metric-validator.js";

const ANALYTICS_EVENT_SOURCE_ENGINES: readonly CommerceEngineModule[] = [
  "marketplace-infrastructure-engine",
  "supplier-intelligence-engine",
  "storefront-assembly-engine",
  "advertising-intelligence-engine",
  "live-payment-engine",
  "analytics-intelligence-engine",
];

const ANALYTICS_EVENT_SOURCE_CONSUMERS = ["logistics-engine", "business-automation"] as const;

const ENGINE_EVENT_CATEGORY_MAP: Record<string, AnalyticsCategory> = {
  "marketplace-infrastructure-engine": "marketplace_metrics",
  "supplier-intelligence-engine": "supplier_metrics",
  "storefront-assembly-engine": "storefront_metrics",
  "advertising-intelligence-engine": "advertising_metrics",
  "live-payment-engine": "payment_metrics",
  "logistics-engine": "logistics_metrics",
  "business-automation": "operational_metrics",
  "analytics-intelligence-engine": "commerce_metrics",
};

export function listAnalyticsEventSourceEngines(): readonly CommerceEngineModule[] {
  return ANALYTICS_EVENT_SOURCE_ENGINES;
}

export function listAnalyticsEventSourceConsumers(): readonly string[] {
  return ANALYTICS_EVENT_SOURCE_CONSUMERS;
}

export function receiveOperationalEventFromEngine(input: {
  context: RegistryLoaderContext;
  sourceEngineId: string;
  eventRef: string;
  analyticsId?: string;
}): AnalyticsEngineEventEnvelope[] {
  const allowedSources = [
    ...ANALYTICS_EVENT_SOURCE_ENGINES,
    ...ANALYTICS_EVENT_SOURCE_CONSUMERS,
  ] as readonly string[];

  if (!allowedSources.includes(input.sourceEngineId)) {
    return [];
  }

  const category = ENGINE_EVENT_CATEGORY_MAP[input.sourceEngineId];
  if (!category) {
    return [];
  }

  const discovery = discoverAnalyticsProviders(input.context);
  const targets = input.analyticsId
    ? discovery.providers.filter((entry) => entry.analyticsId === input.analyticsId)
    : discovery.providers;

  return targets.map((provider) => {
    const validation = validateAnalyticsEventRef(provider, input.eventRef, category);
    return {
      sourceEngineId: input.sourceEngineId,
      analyticsId: provider.analyticsId,
      eventRef: input.eventRef,
      category,
      accepted: validation.valid,
      discoverySource: "AnalyticsProviderCatalog:engine-event-bridge" as const,
    };
  });
}

export function receiveOperationalEventsFromAllEngines(
  context: RegistryLoaderContext,
  eventRef: string,
): AnalyticsEngineEventEnvelope[] {
  const sources = [...ANALYTICS_EVENT_SOURCE_ENGINES, ...ANALYTICS_EVENT_SOURCE_CONSUMERS];
  return sources.flatMap((sourceEngineId) =>
    receiveOperationalEventFromEngine({ context, sourceEngineId, eventRef }),
  );
}
