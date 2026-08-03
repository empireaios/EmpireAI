export {
  DesignWorker,
  createDesignWorker,
  resetDesignWorkerForTesting,
  type DesignWorkerOptions,
} from "./engine.js";
export type { DesignWorkerDependencies } from "./integrations.js";
export {
  buildDesignWorkerConfiguration,
  DEFAULT_DESIGN_WORKER_CONFIGURATION,
  type DesignWorkerConfiguration,
} from "./configuration.js";
export {
  DESIGN_WORKER_ID,
  DESIGN_WORKER_SYSTEM_PATH,
  DESIGN_WORKER_IDENTITY,
  DW_METADATA_VERSION,
  DESIGN_WORKER_REPORT_VERSION,
  PRODUCT_TYPES as DW_PRODUCT_TYPES,
  ASSET_TYPES as DW_ASSET_TYPES,
  EXPORT_FORMATS as DW_EXPORT_FORMATS,
  RESEARCH_COMPLIANCE_LEVELS as DW_RESEARCH_COMPLIANCE_LEVELS,
  DW_CAPABILITIES,
  INTEGRATION_TARGETS as DW_INTEGRATION_TARGETS,
} from "./paths.js";
export type {
  DesignWorkerState,
  DesignWorkerReport,
  DesignWorkerReport as DwDesignWorkerReport,
  DesignWorkerInput,
  DesignWorkerRunReport,
  DesignWorkerCatalog,
  DesignWorkerCockpitSnapshot,
  DesignWorkerEngineRecord,
  DesignWorkerValidationReport,
  DesignAsset as DwDesignAsset,
  BrandingThemeDetails as DwBrandingThemeDetails,
  ProductType as DwProductType,
  AssetType as DwAssetType,
  ExportFormat as DwExportFormat,
  IntegrationHandshake as DwIntegrationHandshake,
  SelfReviewFinding as DwSelfReviewFinding,
} from "./types.js";
export { resetDesignSequenceForTesting } from "./design-builder.js";
export { appendDwLog, getDwLogs, resetDwLogsForTesting } from "./dw-logging.js";
