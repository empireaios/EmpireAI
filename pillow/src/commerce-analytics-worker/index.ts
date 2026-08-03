export {
  CommerceAnalyticsWorker,
  createCommerceAnalyticsWorker,
  resetCommerceAnalyticsWorkerForTesting,
  type CommerceAnalyticsWorkerOptions,
} from "./engine.js";
export type { CommerceAnalyticsWorkerDependencies } from "./integrations.js";
export {
  buildCommerceAnalyticsWorkerConfiguration,
  DEFAULT_COMMERCE_ANALYTICS_WORKER_CONFIGURATION,
  type CommerceAnalyticsWorkerConfiguration,
} from "./configuration.js";
export {
  COMMERCE_ANALYTICS_WORKER_ID,
  COMMERCE_ANALYTICS_WORKER_SYSTEM_PATH,
  COMMERCE_ANALYTICS_WORKER_IDENTITY,
  CAW_METADATA_VERSION,
  COMMERCE_ANALYTICS_REPORT_VERSION,
  METRIC_KINDS,
  PRODUCT_PERFORMANCE_CLASSIFICATIONS,
  OPPORTUNITY_SEVERITIES,
  CAW_CAPABILITIES,
  INTEGRATION_TARGETS as CAW_INTEGRATION_TARGETS,
} from "./paths.js";
export type {
  CommerceAnalyticsWorkerState,
  CommerceAnalyticsReport as CawCommerceAnalyticsReport,
  CommerceAnalyticsWorkerInput,
  CommerceAnalyticsWorkerRunReport,
  CommerceAnalyticsWorkerCatalog,
  CommerceAnalyticsWorkerCockpitSnapshot,
  CommerceAnalyticsWorkerEngineRecord,
  CommerceAnalyticsWorkerValidationReport,
  AnalyticsContextInput as CawAnalyticsContextInput,
  MetricValue as CawMetricValue,
  SignificantChange as CawSignificantChange,
  ImprovementOpportunity as CawImprovementOpportunity,
  ExecutiveRecommendation as CawExecutiveRecommendation,
  EvidenceItem as CawEvidenceItem,
  MetricKind as CawMetricKind,
  ProductPerformanceClassification as CawProductPerformanceClassification,
  OpportunitySeverity as CawOpportunitySeverity,
  IntegrationHandshake as CawIntegrationHandshake,
} from "./types.js";
export type { CommerceAnalyticsReport } from "./types.js";
export { resetAnalyticsSequenceForTesting } from "./analytics-builder.js";
export { appendCawLog, getCawLogs, resetCawLogsForTesting } from "./caw-logging.js";
