/** PILLOW-SPS-001 — Supplier Product Sync exports (R2-05). */

export {
  SupplierProductSyncEngine,
  createSupplierProductSyncEngine,
  resetSupplierProductSyncForTesting,
} from "./engine.js";

export {
  buildSupplierProductSyncConfiguration,
  DEFAULT_SUPPLIER_PRODUCT_SYNC_CONFIGURATION,
  type SupplierProductSyncConfiguration,
} from "./configuration.js";

export {
  SUPPLIER_PRODUCT_SYNC_SYSTEM_PATH,
  SPS_METADATA_VERSION,
  SUPPLIER_PRODUCT_CATALOG_VERSION,
  SUPPORTED_SUPPLIER_IDENTIFIERS,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
} from "./paths.js";

export type {
  SupplierProductSyncEngineVersion,
  SupplierProductRecord,
  SupplierProductSyncReport,
  SupplierProductSyncState,
  SupplierProductSyncCockpitSnapshot,
  SupplierProductSyncHealthReport,
  SupplierProductSyncPerformanceStats,
  SyncSupplierProductsInput,
  ReceiveSupplierProductInput,
  DetectDuplicatesInput,
  RawSupplierProductPayload,
  ProductChangeFinding,
  DuplicateProductGroup,
  MissingAttributeFinding,
  InvalidProductFinding,
  SupportedSupplierIdentifier,
  EngineStatus,
  HealthStatus,
  ProductStatus,
  SynchronizationStatus,
} from "./types.js";
