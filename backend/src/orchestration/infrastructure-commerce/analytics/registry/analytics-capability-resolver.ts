/**
 * G2-07 — Analytics capability resolution from registry-backed contracts.
 */

import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import {
  ANALYTICS_DOMAIN_CAPABILITIES,
  ANALYTICS_METRIC_LIFECYCLE,
  type AnalyticsCapabilityResolution,
  type AnalyticsCategory,
  type AnalyticsDomainCapability,
  type AnalyticsMetricLifecyclePhase,
} from "../contracts/analytics-integration-types.js";
import { parseAnalyticsIntegrationConfiguration } from "../validation/analytics-contract-validator.js";
import {
  resolveAnalyticsRegistrySnapshot,
  resolvePolicyForAnalytics,
} from "./analytics-registry-resolver.js";

function resolveDomainCapabilities(
  configuration: ReturnType<typeof parseAnalyticsIntegrationConfiguration>,
): AnalyticsDomainCapability[] {
  return ANALYTICS_DOMAIN_CAPABILITIES.filter(
    (domain) => configuration.domainContracts[domain]?.supported === true,
  );
}

function resolveCategories(
  configuration: ReturnType<typeof parseAnalyticsIntegrationConfiguration>,
): AnalyticsCategory[] {
  const categories = new Set<AnalyticsCategory>();
  for (const metric of configuration.supportedMetrics) {
    if (metric.supported) categories.add(metric.category);
  }
  for (const event of configuration.supportedEvents) {
    if (event.supported) categories.add(event.category);
  }
  return [...categories];
}

function isPolicyCompliant(
  context: RegistryLoaderContext,
  provider: ReturnType<typeof resolveAnalyticsRegistrySnapshot>["providers"][0],
): boolean {
  const policy = resolvePolicyForAnalytics(context, provider);
  if (!policy) {
    return provider.dependencies.length === 0;
  }
  return policy.status === "VALIDATED" || policy.status === "PUBLISHED";
}

export function resolveAnalyticsCapabilities(
  context: RegistryLoaderContext,
  analyticsId: string,
  lifecyclePhase: AnalyticsMetricLifecyclePhase = "capture",
): AnalyticsCapabilityResolution {
  const snapshot = resolveAnalyticsRegistrySnapshot(context, { registryRowId: analyticsId });
  const provider = snapshot.providers[0];
  if (!provider) {
    throw new Error(`Unknown analytics provider: ${analyticsId}`);
  }

  const integration = parseAnalyticsIntegrationConfiguration(provider.configuration);

  return {
    analyticsId: provider.id,
    resolvedCapabilities: resolveDomainCapabilities(integration),
    categories: resolveCategories(integration),
    lifecyclePhase,
    policyCompliant: isPolicyCompliant(context, provider),
    registryBacked: true,
  };
}

export function resolveAllAnalyticsCapabilities(
  context: RegistryLoaderContext = {},
  lifecyclePhase: AnalyticsMetricLifecyclePhase = "capture",
): AnalyticsCapabilityResolution[] {
  const snapshot = resolveAnalyticsRegistrySnapshot(context);
  return snapshot.providers.map((provider) =>
    resolveAnalyticsCapabilities(context, provider.id, lifecyclePhase),
  );
}

export function listSupportedAnalyticsLifecyclePhases(): readonly AnalyticsMetricLifecyclePhase[] {
  return ANALYTICS_METRIC_LIFECYCLE;
}
