/**
 * G2-07 — Foundation analytics provider seed (dynamic catalog — no hardcoded KPIs).
 */

import { ANALYTICS_INTEGRATION_VERSION } from "../contracts/analytics-integration-types.js";
import type { AnalyticsProviderRow } from "../contracts/analytics-integration-types.js";

const foundationDomainContracts = {
  event_collection: { contractVersion: ANALYTICS_INTEGRATION_VERSION, supported: true },
  metric_collection: { contractVersion: ANALYTICS_INTEGRATION_VERSION, supported: true },
  aggregation: { contractVersion: ANALYTICS_INTEGRATION_VERSION, supported: true },
  normalisation: { contractVersion: ANALYTICS_INTEGRATION_VERSION, supported: true },
  time_series_recording: { contractVersion: ANALYTICS_INTEGRATION_VERSION, supported: true },
  business_kpi_publication: { contractVersion: ANALYTICS_INTEGRATION_VERSION, supported: true },
  executive_metric_publication: { contractVersion: ANALYTICS_INTEGRATION_VERSION, supported: false },
} as const;

const primaryAnalyticsIntegrationFramework = {
  schemaVersion: ANALYTICS_INTEGRATION_VERSION,
  aggregationModes: ["real_time", "batch"] as const,
  supportedMetrics: [
    { metricRef: "mtr-foundation-commerce-ops", category: "commerce_metrics" as const, supported: true },
    { metricRef: "mtr-foundation-marketplace-ops", category: "marketplace_metrics" as const, supported: true },
    { metricRef: "mtr-foundation-supplier-ops", category: "supplier_metrics" as const, supported: true },
    { metricRef: "mtr-foundation-storefront-ops", category: "storefront_metrics" as const, supported: true },
    { metricRef: "mtr-foundation-payment-ops", category: "payment_metrics" as const, supported: true },
    { metricRef: "mtr-foundation-logistics-ops", category: "logistics_metrics" as const, supported: true },
    { metricRef: "mtr-foundation-operational-ops", category: "operational_metrics" as const, supported: true },
  ],
  supportedEvents: [
    { eventRef: "evt-foundation-commerce-signal", category: "commerce_metrics" as const, supported: true },
    { eventRef: "evt-foundation-marketplace-signal", category: "marketplace_metrics" as const, supported: true },
    { eventRef: "evt-foundation-supplier-signal", category: "supplier_metrics" as const, supported: true },
    { eventRef: "evt-foundation-storefront-signal", category: "storefront_metrics" as const, supported: true },
    { eventRef: "evt-foundation-advertising-signal", category: "advertising_metrics" as const, supported: true },
    { eventRef: "evt-foundation-payment-signal", category: "payment_metrics" as const, supported: true },
    { eventRef: "evt-foundation-logistics-signal", category: "logistics_metrics" as const, supported: true },
    { eventRef: "evt-foundation-customer-signal", category: "customer_metrics" as const, supported: true },
    { eventRef: "evt-foundation-operational-signal", category: "operational_metrics" as const, supported: true },
  ],
  retentionPolicy: {
    retentionDays: 90,
    policyRef: "pol-foundation-commerce-default",
    archiveAfterDays: 365,
  },
  domainContracts: foundationDomainContracts,
};

const secondaryAnalyticsIntegrationFramework = {
  ...primaryAnalyticsIntegrationFramework,
  aggregationModes: ["batch", "streaming", "warehouse"] as const,
  supportedMetrics: [
    { metricRef: "mtr-foundation-executive-summary", category: "executive_metrics" as const, supported: true },
    { metricRef: "mtr-foundation-executive-trend", category: "executive_metrics" as const, supported: true },
  ],
  supportedEvents: [
    { eventRef: "evt-foundation-executive-signal", category: "executive_metrics" as const, supported: true },
  ],
  domainContracts: {
    ...foundationDomainContracts,
    event_collection: { contractVersion: ANALYTICS_INTEGRATION_VERSION, supported: false },
    business_kpi_publication: { contractVersion: ANALYTICS_INTEGRATION_VERSION, supported: false },
    executive_metric_publication: { contractVersion: ANALYTICS_INTEGRATION_VERSION, supported: true },
  },
};

export const ANALYTICS_PROVIDER_SEED_ROWS: AnalyticsProviderRow[] = [
  {
    id: "analytics-foundation-operational-primary",
    name: "Foundation Operational Analytics Provider",
    description: "Generic operational analytics binding — metrics resolved from catalog at runtime",
    status: "VALIDATED",
    version: "1.0.0",
    owner: "pillow:governance",
    dependencies: ["pol-foundation-commerce-default", "cty-foundation-global-template"],
    capabilities: ["collect", "aggregate", "publish"],
    configuration: { integrationFramework: primaryAnalyticsIntegrationFramework },
    supportedRegions: ["global"],
    supportedCountries: ["*"],
    policyRef: "pol-foundation-commerce-default",
    providerRef: "prov-foundation-analytics-adapter",
    pluginSupport: { allowPluginRegistration: true, pluginKind: "commerce_analytics" },
  },
  {
    id: "analytics-foundation-executive-secondary",
    name: "Foundation Executive Analytics Provider",
    description: "Executive metric publication slot — data only, no executive reasoning",
    status: "VALIDATED",
    version: "1.0.0",
    owner: "pillow:governance",
    dependencies: ["pol-foundation-commerce-default"],
    capabilities: ["publish", "archive"],
    configuration: { integrationFramework: secondaryAnalyticsIntegrationFramework },
    supportedRegions: ["global"],
    supportedCountries: ["US"],
    policyRef: "pol-foundation-commerce-default",
    providerRef: "prov-foundation-analytics-adapter-alt",
    pluginSupport: { allowPluginRegistration: true, pluginKind: "commerce_analytics" },
  },
];
