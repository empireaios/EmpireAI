export {
  DigitalProductAnalyticsWorker,
  createDigitalProductAnalyticsWorker,
  resetDigitalProductAnalyticsWorkerForTesting,
  type DigitalProductAnalyticsWorkerOptions,
} from "./engine.js";
export type { DigitalProductAnalyticsWorkerDependencies } from "./integrations.js";
export {
  buildDigitalProductAnalyticsWorkerConfiguration,
  DEFAULT_DIGITAL_PRODUCT_ANALYTICS_WORKER_CONFIGURATION,
  type DigitalProductAnalyticsWorkerConfiguration,
} from "./configuration.js";
export {
  DIGITAL_PRODUCT_ANALYTICS_WORKER_ID,
  DIGITAL_PRODUCT_ANALYTICS_WORKER_SYSTEM_PATH,
  DIGITAL_PRODUCT_ANALYTICS_WORKER_IDENTITY,
  DPA_METADATA_VERSION,
  DIGITAL_PRODUCT_ANALYTICS_WORKER_REPORT_VERSION,
  ANALYTICS_TYPES as DPA_ANALYTICS_TYPES,
  RESEARCH_COMPLIANCE_LEVELS as DPA_RESEARCH_COMPLIANCE_LEVELS,
  DPA_CAPABILITIES,
  INTEGRATION_TARGETS as DPA_INTEGRATION_TARGETS,
} from "./paths.js";
export type {
  DigitalProductAnalyticsWorkerState,
  DigitalProductAnalyticsReport,
  DigitalProductAnalyticsReport as DpaDigitalProductAnalyticsReport,
  DigitalProductAnalyticsWorkerInput,
  DigitalProductAnalyticsWorkerRunReport,
  DigitalProductAnalyticsWorkerCatalog,
  DigitalProductAnalyticsWorkerCockpitSnapshot,
  DigitalProductAnalyticsWorkerEngineRecord,
  DigitalProductAnalyticsWorkerValidationReport,
  AnalyticsStep as DpaAnalyticsStep,
  SalesMetrics as DpaSalesMetrics,
  RevenueMetrics as DpaRevenueMetrics,
  ProfitMetrics as DpaProfitMetrics,
  ConversionMetrics as DpaConversionMetrics,
  RefundMetrics as DpaRefundMetrics,
  CustomerFeedbackSummary as DpaCustomerFeedbackSummary,
  ImprovementRecommendation as DpaImprovementRecommendation,
  AnalyticsType as DpaAnalyticsType,
  IntegrationHandshake as DpaIntegrationHandshake,
  SelfReviewFinding as DpaSelfReviewFinding,
} from "./types.js";
export { resetAnalyticsSequenceForTesting } from "./digital-product-analytics-builder.js";
export { appendDpaLog, getDpaLogs, resetDpaLogsForTesting } from "./dpa-logging.js";
