export {
  INTELLIGENCE_MODULE_CATALOG,
  INTELLIGENCE_MODULE_IDS,
  isIntelligenceModuleId,
  type IntelligenceModuleCatalogEntry,
  type IntelligenceModuleId,
} from "./module-ids.js";

export {
  MODULE_CAPABILITIES,
  type CfoCapability,
  type CustomerSupportCapability,
  type GuardianCapability,
  type IntelligenceCapability,
  type InventoryCapability,
  type MarketingStrategistCapability,
  type ModuleCapabilityMap,
  type PricingCapability,
  type ProductScoutCapability,
  type SeoCapability,
  type SupplierIntelligenceCapability,
} from "./capabilities.js";

export type {
  BrainDecision,
  BrainExecutionResult,
  BrainObservation,
  BrainRecommendation,
  IntelligenceBrainTask,
  ModuleHealthReport,
  ModuleInputSpec,
  ModuleOutputSpec,
  ModuleValidationResult,
} from "./types.js";

export type {
  AIEmployeeModule,
  IntelligenceModuleContract,
} from "./intelligence-module.js";

export {
  StubIntelligenceModuleRegistry,
  intelligenceModuleRegistry,
  type IntelligenceModuleRegistry,
} from "./registry.js";

export {
  PRODUCT_SCOUT_ACTION_MAP,
  PRODUCT_INTELLIGENCE_ACTION_MAP,
  SUPPLIER_INTELLIGENCE_ACTION_MAP,
  type ProductScoutModuleContractAdapter,
  type ProductScoutTaskInput,
  type ProductIntelligenceModuleContractAdapter,
  type ProductIntelligenceCapability,
  type ProductIntelligenceTaskInput,
  type SupplierIntelligenceModuleContractAdapter,
  type SupplierIntelligenceModuleCapability,
} from "./adapters.js";
