/**
 * G2-07 — Analytics domain contract builder from registry-backed adapter contracts.
 */

import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import type { AnalyticsProviderRow } from "../contracts/analytics-integration-types.js";
import type { AnalyticsDomainContractBundle } from "../contracts/analytics-domain-contracts.js";
import {
  buildAnalyticsAdapterContract,
  parseAnalyticsIntegrationConfiguration,
} from "../validation/analytics-contract-validator.js";
import { resolveRetentionPolicyForAnalytics } from "../registry/analytics-registry-resolver.js";

export function buildAnalyticsDomainContractBundle(
  context: RegistryLoaderContext,
  provider: AnalyticsProviderRow,
): AnalyticsDomainContractBundle {
  const contract = buildAnalyticsAdapterContract(provider);
  const integration = parseAnalyticsIntegrationConfiguration(provider.configuration);
  const retention = resolveRetentionPolicyForAnalytics(context, provider);

  const categories = [
    ...new Set([
      ...integration.supportedMetrics.filter((m) => m.supported).map((m) => m.category),
      ...integration.supportedEvents.filter((e) => e.supported).map((e) => e.category),
    ]),
  ];

  return {
    eventCollection: {
      contractKind: "event_collection",
      contractVersion: integration.domainContracts.event_collection.contractVersion,
      supportedEvents: contract.supportedEvents.filter((event) => event.supported),
      pillowGoverned: true,
    },
    metricCollection: {
      contractKind: "metric_collection",
      contractVersion: integration.domainContracts.metric_collection.contractVersion,
      supportedMetrics: contract.supportedMetrics.filter((metric) => metric.supported),
    },
    aggregation: {
      contractKind: "aggregation",
      contractVersion: integration.domainContracts.aggregation.contractVersion,
      aggregationModes: contract.aggregationModes,
    },
    normalisation: {
      contractKind: "normalisation",
      contractVersion: integration.domainContracts.normalisation.contractVersion,
      schemaVersion: integration.schemaVersion,
    },
    timeSeriesRecording: {
      contractKind: "time_series_recording",
      contractVersion: integration.domainContracts.time_series_recording.contractVersion,
      retentionPolicy: {
        retentionDays: retention.retentionDays,
        policyRef: retention.policyRef,
        archiveAfterDays: integration.retentionPolicy.archiveAfterDays,
      },
    },
    businessKpiPublication: {
      contractKind: "business_kpi_publication",
      contractVersion: integration.domainContracts.business_kpi_publication.contractVersion,
      categories,
      reasoningEmbedded: false,
    },
    executiveMetricPublication: {
      contractKind: "executive_metric_publication",
      contractVersion: integration.domainContracts.executive_metric_publication.contractVersion,
      executiveMetricsOnly: true,
      reasoningEmbedded: false,
    },
  };
}
