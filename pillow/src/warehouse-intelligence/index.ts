/** PILLOW-WI-001 — Warehouse Intelligence exports (R2-14). */

export {
  WarehouseIntelligenceEngine,
  createWarehouseIntelligenceEngine,
  resetWarehouseIntelligenceForTesting,
} from "./engine.js";

export {
  buildWarehouseIntelligenceConfiguration,
  DEFAULT_WAREHOUSE_INTELLIGENCE_CONFIGURATION,
  type WarehouseIntelligenceConfiguration,
} from "./configuration.js";

export {
  WAREHOUSE_INTELLIGENCE_SYSTEM_PATH,
  WI_METADATA_VERSION,
  WAREHOUSE_IDENTIFIERS,
  WAREHOUSE_STATUSES,
} from "./paths.js";

export type {
  WarehouseIntelligenceVersion,
  WarehouseRecord,
  WarehouseReport,
  WarehouseIntelligenceState,
  WarehouseCockpitSnapshot,
  WarehouseHealthReport,
  WarehousePerformanceStats,
  CoordinateWarehousesInput,
  AllocateWarehouseInput,
  OptimizeInventoryDistributionInput,
  WarehouseIdentifier,
  WarehouseStatus,
} from "./types.js";
