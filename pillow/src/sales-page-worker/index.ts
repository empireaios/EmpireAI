export {
  SalesPageWorker,
  createSalesPageWorker,
  resetSalesPageWorkerForTesting,
  type SalesPageWorkerOptions,
} from "./engine.js";
export type { SalesPageWorkerDependencies } from "./integrations.js";
export {
  buildSalesPageWorkerConfiguration,
  DEFAULT_SALES_PAGE_WORKER_CONFIGURATION,
  type SalesPageWorkerConfiguration,
} from "./configuration.js";
export {
  SALES_PAGE_WORKER_ID,
  SALES_PAGE_WORKER_SYSTEM_PATH,
  SALES_PAGE_WORKER_IDENTITY,
  SPW_METADATA_VERSION,
  SALES_PAGE_WORKER_REPORT_VERSION,
  PRODUCT_TYPES as SPW_PRODUCT_TYPES,
  PAGE_TYPES as SPW_PAGE_TYPES,
  EXPORT_FORMATS as SPW_EXPORT_FORMATS,
  RESEARCH_COMPLIANCE_LEVELS as SPW_RESEARCH_COMPLIANCE_LEVELS,
  SPW_CAPABILITIES,
  INTEGRATION_TARGETS as SPW_INTEGRATION_TARGETS,
} from "./paths.js";
export type {
  SalesPageWorkerState,
  SalesPageReport,
  SalesPageReport as SpwSalesPageReport,
  SalesPageWorkerInput,
  SalesPageWorkerRunReport,
  SalesPageWorkerCatalog,
  SalesPageWorkerCockpitSnapshot,
  SalesPageWorkerEngineRecord,
  SalesPageWorkerValidationReport,
  LandingPageSection as SpwLandingPageSection,
  FeatureSection as SpwFeatureSection,
  SalesTestimonial as SpwSalesTestimonial,
  ProductType as SpwProductType,
  PageType as SpwPageType,
  ExportFormat as SpwExportFormat,
  IntegrationHandshake as SpwIntegrationHandshake,
  SelfReviewFinding as SpwSelfReviewFinding,
} from "./types.js";
export { resetSalesPageSequenceForTesting } from "./sales-page-builder.js";
export { appendSpwLog, getSpwLogs, resetSpwLogsForTesting } from "./spw-logging.js";
