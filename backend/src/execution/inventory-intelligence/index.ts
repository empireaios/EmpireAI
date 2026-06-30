export {
  demandForecastSchema,
  validateDemandForecast,
} from "./models/demand-forecast.js";
export type { DemandForecast } from "./models/demand-forecast.js";

export {
  seasonalityProfileSchema,
  validateSeasonalityProfile,
} from "./models/seasonality-profile.js";
export type { SeasonalityProfile } from "./models/seasonality-profile.js";

export {
  SUPPLIER_STOCK_STATUSES,
  supplierStockSchema,
  validateSupplierStock,
} from "./models/supplier-stock.js";
export type { SupplierStockStatus, SupplierStock } from "./models/supplier-stock.js";

export {
  leadTimeEstimateSchema,
  validateLeadTimeEstimate,
} from "./models/lead-time-estimate.js";
export type { LeadTimeEstimate } from "./models/lead-time-estimate.js";

export {
  safetyStockSchema,
  validateSafetyStock,
} from "./models/safety-stock.js";
export type { SafetyStock } from "./models/safety-stock.js";

export {
  RESTOCK_ALERT_PRIORITIES,
  restockAlertSchema,
  validateRestockAlert,
} from "./models/restock-alert.js";
export type { RestockAlertPriority, RestockAlert } from "./models/restock-alert.js";

export {
  INVENTORY_SIGNAL_TYPES,
  inventorySignalSchema,
  validateInventorySignal,
} from "./models/inventory-signal.js";
export type { InventorySignalType, InventorySignal } from "./models/inventory-signal.js";

export {
  inventoryPredictionReportSchema,
  validateInventoryPredictionReport,
} from "./models/inventory-prediction-report.js";
export type {
  InventoryPredictionReportId,
  InventoryPredictionReport,
  InventoryPredictionReportCreateInput,
} from "./models/inventory-prediction-report.js";

export {
  inventoryIntelligenceRecordSchema,
  validateInventoryIntelligenceRecord,
} from "./models/inventory-intelligence-record.js";
export type {
  InventoryIntelligenceRecordId,
  InventoryIntelligenceRecord,
  InventoryIntelligenceRecordCreateInput,
} from "./models/inventory-intelligence-record.js";

export type {
  InventoryIntelligenceRepositoryQuery,
  InventoryIntelligenceRepository,
} from "./repositories/inventory-intelligence-repository.js";

export {
  InMemoryInventoryIntelligenceRepository,
  createInMemoryInventoryIntelligenceRepository,
} from "./repositories/in-memory-inventory-intelligence-repository.js";

export {
  INVENTORY_SIGNAL_WEIGHTS,
  generateInventoryPrediction,
  inventoryIntelligenceScoring,
} from "./scoring/inventory-intelligence-scoring.js";
export type {
  InventoryIntelligenceBrandInput,
  InventoryIntelligenceProductInput,
  InventoryIntelligenceInput,
  InventoryIntelligenceBreakdown,
} from "./scoring/inventory-intelligence-scoring.js";

export {
  InventoryIntelligenceEngine,
  defaultInventoryIntelligenceEngine,
} from "./engines/inventory-intelligence-engine.js";

export {
  INVENTORY_INTELLIGENCE_MODULE_ID,
  INVENTORY_INTELLIGENCE_MODULE_VERSION,
  INVENTORY_INTELLIGENCE_CAPABILITIES,
  INVENTORY_INTELLIGENCE_MODULE_CONTRACT,
  InventoryIntelligenceModule,
  createInventoryIntelligenceModule,
  inventoryIntelligenceModule,
} from "./contract/inventory-intelligence-module.js";
export type {
  InventoryIntelligenceModuleId,
  InventoryIntelligenceCapability,
  InventoryIntelligenceModuleContract,
} from "./contract/inventory-intelligence-module.js";
