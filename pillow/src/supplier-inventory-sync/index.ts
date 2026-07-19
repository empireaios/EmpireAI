/** PILLOW-SIS-001 — Supplier Inventory Sync exports (R2-06). */

export {
  SupplierInventorySyncEngine,
  createSupplierInventorySyncEngine,
  resetSupplierInventorySyncForTesting,
} from "./engine.js";

export {
  buildSupplierInventorySyncConfiguration,
  DEFAULT_SUPPLIER_INVENTORY_SYNC_CONFIGURATION,
  type SupplierInventorySyncConfiguration,
} from "./configuration.js";

export {
  SUPPLIER_INVENTORY_SYNC_SYSTEM_PATH,
  SIS_METADATA_VERSION,
  SUPPORTED_SUPPLIER_IDENTIFIERS,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  STOCK_AVAILABILITY_STATUSES,
} from "./paths.js";

export type {
  SupplierInventorySyncEngineVersion,
  SupplierInventoryRecord,
  SupplierInventorySyncReport,
  SupplierInventorySyncState,
  SupplierInventorySyncCockpitSnapshot,
  SupplierInventorySyncHealthReport,
  SupplierInventorySyncPerformanceStats,
  SyncSupplierInventoryInput,
  ReceiveSupplierInventoryInput,
  InventoryChangeFinding,
  RawSupplierInventoryPayload,
  SupportedSupplierIdentifier,
  EngineStatus,
  HealthStatus,
  StockAvailabilityStatus,
  SynchronizationStatus,
  ValidationStatus,
} from "./types.js";
