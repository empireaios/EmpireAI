export {
  MediaAnalyticsWorker,
  createMediaAnalyticsWorker,
  resetMediaAnalyticsWorkerForTesting,
  type MediaAnalyticsWorkerOptions,
} from "./engine.js";
export type { MediaAnalyticsWorkerDependencies } from "./integrations.js";
export {
  buildMediaAnalyticsWorkerConfiguration,
  DEFAULT_MEDIA_ANALYTICS_WORKER_CONFIGURATION,
  type MediaAnalyticsWorkerConfiguration,
} from "./configuration.js";
export {
  MEDIA_ANALYTICS_WORKER_ID,
  MEDIA_ANALYTICS_WORKER_SYSTEM_PATH,
  MEDIA_ANALYTICS_WORKER_IDENTITY,
  MAW_METADATA_VERSION,
  MAW_REPORT_VERSION,
  ANALYTICS_PLATFORMS,
  PUBLISHING_PLATFORMS,
  METRIC_SOURCES,
  PATTERN_CLASSIFICATIONS,
  PATTERN_DIMENSIONS,
  COMPARISON_DIMENSIONS,
  PATTERN_SEVERITIES,
  MAW_CAPABILITIES,
  INTEGRATION_TARGETS as MAW_INTEGRATION_TARGETS,
} from "./paths.js";
export type {
  MediaAnalyticsWorkerState,
  MediaAnalyticsReport,
  MediaAnalyticsReport as MawMediaAnalyticsReport,
  MediaAnalyticsWorkerInput,
  MediaAnalyticsWorkerRunReport,
  MediaAnalyticsWorkerCatalog,
  MediaAnalyticsWorkerCockpitSnapshot,
  MediaAnalyticsWorkerEngineRecord,
  MediaAnalyticsWorkerValidationReport,
  MetricValue,
  MetricValue as MawMetricValue,
  RetentionMetrics,
  SubscriberImpact,
  EngagementMetrics,
  RevenueMetrics,
  PerformancePattern,
  ComparisonEntry,
  ComparisonTargetInput,
  AnalyticsPlatform,
  MetricSource,
  PatternClassification,
  IntegrationHandshake as MawIntegrationHandshake,
} from "./types.js";
export { resetAnalyticsSequenceForTesting } from "./analytics-builder.js";
export { appendMawLog, getMawLogs, resetMawLogsForTesting } from "./maw-logging.js";
