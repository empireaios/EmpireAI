/**
 * G2-07 — Analytics metric validation (framework-only — no executive reasoning).
 */

import type {
  AnalyticsAdapterContract,
  AnalyticsCategory,
  AnalyticsMetricValidationResult,
} from "../contracts/analytics-integration-types.js";

export function validateAnalyticsMetricRef(
  contract: AnalyticsAdapterContract,
  metricRef: string,
  category: AnalyticsCategory,
): AnalyticsMetricValidationResult {
  const metric = contract.supportedMetrics.find(
    (entry) => entry.metricRef === metricRef && entry.category === category,
  );

  if (!metric) {
    return {
      analyticsId: contract.analyticsId,
      valid: false,
      metricRef,
      category,
      reason: `Metric ref ${metricRef} not registered for category ${category}`,
    };
  }

  if (!metric.supported) {
    return {
      analyticsId: contract.analyticsId,
      valid: false,
      metricRef,
      category,
      reason: `Metric ref ${metricRef} is not supported by provider ${contract.analyticsId}`,
    };
  }

  return {
    analyticsId: contract.analyticsId,
    valid: true,
    metricRef,
    category,
    reason: "Analytics metric ref validated — data publication only, no executive reasoning",
  };
}

export function validateAnalyticsEventRef(
  contract: AnalyticsAdapterContract,
  eventRef: string,
  category: AnalyticsCategory,
): { valid: boolean; reason: string } {
  const event = contract.supportedEvents.find(
    (entry) => entry.eventRef === eventRef && entry.category === category,
  );

  if (!event?.supported) {
    return {
      valid: false,
      reason: `Event ref ${eventRef} not supported for category ${category}`,
    };
  }

  return { valid: true, reason: "Analytics event ref validated" };
}
