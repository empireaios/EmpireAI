/** PILLOW-MWS-001 — Multi-Warehouse Support exports (R2-15). */

export {
  MultiWarehouseSupportEngine,
  createMultiWarehouseSupportEngine,
  resetMultiWarehouseSupportForTesting,
} from "./engine.js";

export {
  buildMultiWarehouseSupportConfiguration,
  DEFAULT_MULTI_WAREHOUSE_SUPPORT_CONFIGURATION,
  type MultiWarehouseSupportConfiguration,
} from "./configuration.js";

export {
  MULTI_WAREHOUSE_SUPPORT_SYSTEM_PATH,
  MWS_METADATA_VERSION,
  WAREHOUSE_IDENTIFIERS as MWS_WAREHOUSE_IDENTIFIERS,
  INVENTORY_TRANSFER_STATUSES,
  WAREHOUSE_HEALTH_STATUSES,
} from "./paths.js";

export type {
  MultiWarehouseSupportVersion,
  WarehouseNetworkRecord,
  WarehouseNetworkReport,
  MultiWarehouseSupportState,
  WarehouseNetworkCockpitSnapshot,
  WarehouseNetworkHealthReport,
  WarehouseNetworkPerformanceStats,
  RegisterWarehousesInput,
  SelectWarehouseInput,
  TransferInventoryInput,
  RouteFulfilmentInput,
  WarehouseIdentifier,
  InventoryTransferStatus,
  WarehouseHealthStatus,
} from "./types.js";
