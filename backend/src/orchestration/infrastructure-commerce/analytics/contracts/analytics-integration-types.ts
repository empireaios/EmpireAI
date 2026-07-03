/**
 * G2-07 — Universal analytics integration contract types.
 * Framework-only — no live analytics providers, dashboards, or executive reasoning.
 */

import { z } from "zod";

export const ANALYTICS_INTEGRATION_VERSION = "g2-07-v1" as const;

export const ANALYTICS_METRIC_LIFECYCLE = [
  "capture",
  "validate",
  "normalise",
  "aggregate",
  "store",
  "publish",
  "archive",
] as const;

export type AnalyticsMetricLifecyclePhase = (typeof ANALYTICS_METRIC_LIFECYCLE)[number];

export const ANALYTICS_ADAPTER_STATUSES = [
  "draft",
  "validated",
  "registered",
  "ready",
  "degraded",
  "suspended",
  "archived",
] as const;

export type AnalyticsAdapterStatus = (typeof ANALYTICS_ADAPTER_STATUSES)[number];

export const ANALYTICS_HEALTH_STATUSES = [
  "unknown",
  "healthy",
  "degraded",
  "unhealthy",
  "offline",
] as const;

export type AnalyticsHealthStatus = (typeof ANALYTICS_HEALTH_STATUSES)[number];

export const ANALYTICS_CATEGORIES = [
  "commerce_metrics",
  "marketplace_metrics",
  "supplier_metrics",
  "storefront_metrics",
  "advertising_metrics",
  "payment_metrics",
  "logistics_metrics",
  "customer_metrics",
  "operational_metrics",
  "executive_metrics",
] as const;

export type AnalyticsCategory = (typeof ANALYTICS_CATEGORIES)[number];

export const ANALYTICS_AGGREGATION_MODES = [
  "real_time",
  "batch",
  "streaming",
  "warehouse",
  "data_lake",
  "future_technology",
] as const;

export type AnalyticsAggregationMode = (typeof ANALYTICS_AGGREGATION_MODES)[number];

export const ANALYTICS_DOMAIN_CAPABILITIES = [
  "event_collection",
  "metric_collection",
  "aggregation",
  "normalisation",
  "time_series_recording",
  "business_kpi_publication",
  "executive_metric_publication",
] as const;

export type AnalyticsDomainCapability = (typeof ANALYTICS_DOMAIN_CAPABILITIES)[number];

export const ANALYTICS_EKLS_OBSERVATION_KINDS = [
  "operational_trend",
  "business_outcome",
  "metric_evolution",
  "historical_observation",
  "evidence_reference",
] as const;

export type AnalyticsEklsObservationKind = (typeof ANALYTICS_EKLS_OBSERVATION_KINDS)[number];

export const EXECUTIVE_AI_CONSUMERS = [
  "product-intelligence-engine",
  "market-intelligence-engine",
  "supplier-intelligence-engine",
  "financial-intelligence-engine",
  "advertising-intelligence-engine",
  "customer-intelligence-engine",
  "risk-intelligence-engine",
  "decision-intelligence-engine",
  "executive-intelligence-orchestrator",
] as const;

export type ExecutiveAiConsumer = (typeof EXECUTIVE_AI_CONSUMERS)[number];

const semverPattern = /^\d+\.\d+\.\d+$/;

export const analyticsMetricRefSchema = z.object({
  metricRef: z.string().min(1),
  category: z.enum(ANALYTICS_CATEGORIES),
  supported: z.boolean(),
});

export type AnalyticsMetricRef = z.infer<typeof analyticsMetricRefSchema>;

export const analyticsEventRefSchema = z.object({
  eventRef: z.string().min(1),
  category: z.enum(ANALYTICS_CATEGORIES),
  supported: z.boolean(),
});

export type AnalyticsEventRef = z.infer<typeof analyticsEventRefSchema>;

export const analyticsRetentionPolicySchema = z.object({
  retentionDays: z.number().int().positive(),
  policyRef: z.string().optional(),
  archiveAfterDays: z.number().int().positive().optional(),
});

export type AnalyticsRetentionPolicy = z.infer<typeof analyticsRetentionPolicySchema>;

export const analyticsDomainContractSchema = z.object({
  contractVersion: z.string().min(1),
  supported: z.boolean(),
  capabilityRef: z.string().optional(),
});

export type AnalyticsDomainContractRef = z.infer<typeof analyticsDomainContractSchema>;

export const analyticsPluginCompatibilitySchema = z.object({
  allowPluginRegistration: z.boolean(),
  pluginKind: z.literal("commerce_analytics").optional(),
  pluginId: z.string().optional(),
  minPluginVersion: z.string().optional(),
});

export type AnalyticsPluginCompatibility = z.infer<typeof analyticsPluginCompatibilitySchema>;

export const analyticsIntegrationConfigurationSchema = z.object({
  schemaVersion: z.literal(ANALYTICS_INTEGRATION_VERSION),
  aggregationModes: z.array(z.enum(ANALYTICS_AGGREGATION_MODES)).min(1),
  supportedMetrics: z.array(analyticsMetricRefSchema).min(1),
  supportedEvents: z.array(analyticsEventRefSchema).min(1),
  retentionPolicy: analyticsRetentionPolicySchema,
  domainContracts: z.object({
    event_collection: analyticsDomainContractSchema,
    metric_collection: analyticsDomainContractSchema,
    aggregation: analyticsDomainContractSchema,
    normalisation: analyticsDomainContractSchema,
    time_series_recording: analyticsDomainContractSchema,
    business_kpi_publication: analyticsDomainContractSchema,
    executive_metric_publication: analyticsDomainContractSchema,
  }),
});

export type AnalyticsIntegrationConfiguration = z.infer<
  typeof analyticsIntegrationConfigurationSchema
>;

export type AnalyticsProviderRow = {
  id: string;
  name: string;
  description: string;
  status: "DRAFT" | "VALIDATED" | "PUBLISHED" | "DEPRECATED" | "RETIRED";
  version: string;
  owner: string;
  dependencies: string[];
  capabilities: string[];
  configuration: Record<string, unknown>;
  supportedRegions: string[];
  supportedCountries: string[];
  policyRef?: string;
  providerRef?: string;
  pluginSupport: {
    allowPluginRegistration: boolean;
    pluginKind?: "commerce_analytics";
    pluginId?: string;
  };
};

export const analyticsAdapterContractSchema = z.object({
  analyticsId: z.string().min(1),
  providerName: z.string().min(1),
  version: z.string().regex(semverPattern, "version must be semver (e.g. 1.0.0)"),
  status: z.enum(ANALYTICS_ADAPTER_STATUSES),
  capabilities: z.array(z.string()).min(1),
  supportedMetrics: z.array(analyticsMetricRefSchema).min(1),
  supportedEvents: z.array(analyticsEventRefSchema).min(1),
  aggregationModes: z.array(z.enum(ANALYTICS_AGGREGATION_MODES)).min(1),
  retentionPolicy: analyticsRetentionPolicySchema,
  healthStatus: z.enum(ANALYTICS_HEALTH_STATUSES),
  pluginCompatibility: analyticsPluginCompatibilitySchema,
  domainContracts: analyticsIntegrationConfigurationSchema.shape.domainContracts,
  registryRowRef: z.string().min(1),
  policyRef: z.string().optional(),
  providerRef: z.string().optional(),
  discoverySource: z.literal("AnalyticsProviderCatalog:dynamic"),
});

export type AnalyticsAdapterContract = z.infer<typeof analyticsAdapterContractSchema>;

export type AnalyticsPluginManifest = {
  pluginId: string;
  pluginName: string;
  version: string;
  analyticsProviderRowId: string;
  aggregationModes: AnalyticsAggregationMode[];
  supportedMetrics: AnalyticsMetricRef[];
  pillowGovernance: true;
  extensions: Record<string, unknown>;
};

export type AnalyticsPluginRecord = AnalyticsPluginManifest & {
  lifecyclePhase: AnalyticsMetricLifecyclePhase;
  healthStatus: AnalyticsHealthStatus;
  registeredAt: string;
};

export type AnalyticsDiscoveryResult = {
  discoveredCount: number;
  providers: AnalyticsAdapterContract[];
  generatedAt: string;
  discoverySource: "AnalyticsProviderCatalog:dynamic";
};

export type AnalyticsCapabilityResolution = {
  analyticsId: string;
  resolvedCapabilities: AnalyticsDomainCapability[];
  categories: AnalyticsCategory[];
  lifecyclePhase: AnalyticsMetricLifecyclePhase;
  policyCompliant: boolean;
  registryBacked: true;
};

export type AnalyticsMetricValidationResult = {
  analyticsId: string;
  valid: boolean;
  metricRef: string;
  category: AnalyticsCategory;
  reason: string;
};

export type AnalyticsLifecycleTransitionRequest = {
  analyticsId: string;
  actorId: string;
  workspaceId: string;
  pillowGovernance: true;
  targetPhase: AnalyticsMetricLifecyclePhase;
};

export type AnalyticsLifecycleTransitionResult = {
  analyticsId: string;
  previousPhase: AnalyticsMetricLifecyclePhase;
  currentPhase: AnalyticsMetricLifecyclePhase;
  allowed: boolean;
  reason: string;
};

export type AnalyticsHealthSnapshot = {
  analyticsId: string;
  healthStatus: AnalyticsHealthStatus;
  lifecyclePhase: AnalyticsMetricLifecyclePhase;
  monitoredAt: string;
  registryWired: boolean;
  policyCompliant: boolean;
};

export type AnalyticsBrainCapabilityDescriptor = {
  analyticsId: string;
  capabilities: string[];
  domainCapabilities: AnalyticsDomainCapability[];
  categories: AnalyticsCategory[];
  discoverySource: "AnalyticsProviderCatalog:dynamic";
};

export type AnalyticsExecutiveAiInputEnvelope = {
  consumerId: ExecutiveAiConsumer | string;
  analyticsId: string;
  metricRefs: string[];
  eventRefs: string[];
  domainCapabilities: AnalyticsDomainCapability[];
  dataOnly: true;
  discoverySource: "AnalyticsProviderCatalog:executive-ai-bridge";
};

export type AnalyticsEngineEventEnvelope = {
  sourceEngineId: string;
  analyticsId: string;
  eventRef: string;
  category: AnalyticsCategory;
  accepted: boolean;
  discoverySource: "AnalyticsProviderCatalog:engine-event-bridge";
};

export type AnalyticsEklsObservationRecord = {
  observationId: string;
  analyticsId: string;
  workspaceId: string;
  actorId: string;
  kind: AnalyticsEklsObservationKind;
  signalValue: number;
  signalUnit: "score" | "ratio" | "count" | "latency_ms";
  summary: string;
  evidenceRef?: string;
  recordedAt: string;
  pillowGoverned: true;
  eklsChannel: "infrastructure-commerce";
};

export type AnalyticsEklsObservationResult = {
  accepted: boolean;
  observationId?: string;
  reason: string;
  eklsGoverned: boolean;
};
