export {
  EbookWorker,
  createEbookWorker,
  resetEbookWorkerForTesting,
  type EbookWorkerOptions,
} from "./engine.js";
export type { EbookWorkerDependencies } from "./integrations.js";
export {
  buildEbookWorkerConfiguration,
  DEFAULT_EBOOK_WORKER_CONFIGURATION,
  type EbookWorkerConfiguration,
} from "./configuration.js";
export {
  EBOOK_WORKER_ID,
  EBOOK_WORKER_SYSTEM_PATH,
  EBOOK_WORKER_IDENTITY,
  EBW_METADATA_VERSION,
  EBOOK_REPORT_VERSION,
  PRODUCT_TYPES as EBW_PRODUCT_TYPES,
  EXPORT_FORMATS as EBW_EXPORT_FORMATS,
  RESEARCH_COMPLIANCE_LEVELS as EBW_RESEARCH_COMPLIANCE_LEVELS,
  EBW_CAPABILITIES,
  INTEGRATION_TARGETS as EBW_INTEGRATION_TARGETS,
} from "./paths.js";
export type {
  EbookWorkerState,
  EbookReport,
  EbookReport as EbwEbookReport,
  EbookWorkerInput,
  EbookWorkerRunReport,
  EbookWorkerCatalog,
  EbookWorkerCockpitSnapshot,
  EbookWorkerEngineRecord,
  EbookWorkerValidationReport,
  EbookChapter as EbwEbookChapter,
  EbookChapterStructureEntry as EbwChapterStructureEntry,
  EbookOutline as EbwEbookOutline,
  ProductType as EbwProductType,
  ExportFormat as EbwExportFormat,
  IntegrationHandshake as EbwIntegrationHandshake,
  SelfReviewFinding as EbwSelfReviewFinding,
} from "./types.js";
export { resetEbookSequenceForTesting } from "./ebook-builder.js";
export { appendEbwLog, getEbwLogs, resetEbwLogsForTesting } from "./ebw-logging.js";
