export {
  ThumbnailWorker,
  createThumbnailWorker,
  resetThumbnailWorkerForTesting,
  type ThumbnailWorkerOptions,
} from "./engine.js";
export type { ThumbnailWorkerDependencies } from "./integrations.js";
export {
  buildThumbnailWorkerConfiguration,
  DEFAULT_THUMBNAIL_WORKER_CONFIGURATION,
  type ThumbnailWorkerConfiguration,
} from "./configuration.js";
export {
  THUMBNAIL_WORKER_ID,
  THUMBNAIL_WORKER_SYSTEM_PATH,
  THUMBNAIL_WORKER_IDENTITY,
  THW_METADATA_VERSION,
  THW_REPORT_VERSION,
  CONTENT_FORMATS,
  DESIGN_ELEMENTS,
  EMOTIONAL_TRIGGERS,
  THW_CAPABILITIES,
  INTEGRATION_TARGETS as THW_INTEGRATION_TARGETS,
} from "./paths.js";
export type {
  ThumbnailWorkerState,
  ThumbnailReport,
  ThumbnailReport as ThwThumbnailReport,
  ThumbnailWorkerInput,
  ThumbnailWorkerRunReport,
  ThumbnailWorkerCatalog,
  ThumbnailWorkerCockpitSnapshot,
  ThumbnailWorkerEngineRecord,
  ThumbnailWorkerValidationReport,
  ThumbnailConcept as ThwThumbnailConcept,
  AbVariant as ThwAbVariant,
  TextOverlaySuggestion as ThwTextOverlaySuggestion,
  EmotionalTriggerEntry as ThwEmotionalTriggerEntry,
  ContentFormat as ThwContentFormat,
  DesignElement as ThwDesignElement,
  EmotionalTriggerType as ThwEmotionalTriggerType,
  IntegrationHandshake as ThwIntegrationHandshake,
} from "./types.js";
export { resetThumbnailSequenceForTesting } from "./thumbnail-builder.js";
export { appendThwLog, getThwLogs, resetThwLogsForTesting } from "./thw-logging.js";
