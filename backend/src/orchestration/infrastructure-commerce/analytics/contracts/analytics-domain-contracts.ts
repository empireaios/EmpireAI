/**
 * G2-07 — Analytics domain contract definitions (framework contracts only).
 */

import type {
  AnalyticsAggregationMode,
  AnalyticsCategory,
  AnalyticsDomainCapability,
  AnalyticsEventRef,
  AnalyticsMetricRef,
  AnalyticsRetentionPolicy,
} from "./analytics-integration-types.js";

export type AnalyticsEventCollectionContract = {
  contractKind: "event_collection";
  contractVersion: string;
  supportedEvents: AnalyticsEventRef[];
  pillowGoverned: true;
};

export type AnalyticsMetricCollectionContract = {
  contractKind: "metric_collection";
  contractVersion: string;
  supportedMetrics: AnalyticsMetricRef[];
};

export type AnalyticsAggregationContract = {
  contractKind: "aggregation";
  contractVersion: string;
  aggregationModes: AnalyticsAggregationMode[];
};

export type AnalyticsNormalisationContract = {
  contractKind: "normalisation";
  contractVersion: string;
  schemaVersion: string;
};

export type AnalyticsTimeSeriesRecordingContract = {
  contractKind: "time_series_recording";
  contractVersion: string;
  retentionPolicy: AnalyticsRetentionPolicy;
};

export type AnalyticsBusinessKpiPublicationContract = {
  contractKind: "business_kpi_publication";
  contractVersion: string;
  categories: AnalyticsCategory[];
  reasoningEmbedded: false;
};

export type AnalyticsExecutiveMetricPublicationContract = {
  contractKind: "executive_metric_publication";
  contractVersion: string;
  executiveMetricsOnly: true;
  reasoningEmbedded: false;
};

export type AnalyticsDomainContractBundle = {
  eventCollection: AnalyticsEventCollectionContract;
  metricCollection: AnalyticsMetricCollectionContract;
  aggregation: AnalyticsAggregationContract;
  normalisation: AnalyticsNormalisationContract;
  timeSeriesRecording: AnalyticsTimeSeriesRecordingContract;
  businessKpiPublication: AnalyticsBusinessKpiPublicationContract;
  executiveMetricPublication: AnalyticsExecutiveMetricPublicationContract;
};

export const ANALYTICS_DOMAIN_CONTRACT_KINDS: AnalyticsDomainCapability[] = [
  "event_collection",
  "metric_collection",
  "aggregation",
  "normalisation",
  "time_series_recording",
  "business_kpi_publication",
  "executive_metric_publication",
];

export function listAnalyticsDomainContractKinds(): readonly AnalyticsDomainCapability[] {
  return ANALYTICS_DOMAIN_CONTRACT_KINDS;
}
