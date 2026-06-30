export {
  PRODUCT_MEMORY_OUTCOMES,
  productMemorySchema,
  validateProductMemory,
} from "./models/product-memory.js";
export type { ProductMemoryOutcome, ProductMemory } from "./models/product-memory.js";

export {
  CAMPAIGN_MEMORY_OUTCOMES,
  campaignMemorySchema,
  validateCampaignMemory,
} from "./models/campaign-memory.js";
export type { CampaignMemoryOutcome, CampaignMemory } from "./models/campaign-memory.js";

export {
  SUPPLIER_MEMORY_OUTCOMES,
  supplierMemorySchema,
  validateSupplierMemory,
} from "./models/supplier-memory.js";
export type { SupplierMemoryOutcome, SupplierMemory } from "./models/supplier-memory.js";

export {
  brandMemorySchema,
  validateBrandMemory,
} from "./models/brand-memory.js";
export type { BrandMemory } from "./models/brand-memory.js";

export {
  FAILURE_SEVERITIES,
  failureMemorySchema,
  validateFailureMemory,
} from "./models/failure-memory.js";
export type { FailureSeverity, FailureMemory } from "./models/failure-memory.js";

export {
  successMemorySchema,
  validateSuccessMemory,
} from "./models/success-memory.js";
export type { SuccessMemory } from "./models/success-memory.js";

export {
  STORE_HISTORY_EVENT_TYPES,
  storeHistoryEventSchema,
  storeHistorySchema,
  validateStoreHistory,
  validateStoreHistoryEvent,
} from "./models/store-history.js";
export type { StoreHistoryEventType, StoreHistoryEvent, StoreHistory } from "./models/store-history.js";

export {
  IMPROVEMENT_PRIORITIES,
  decisionImprovementSchema,
  validateDecisionImprovement,
} from "./models/decision-improvement.js";
export type { ImprovementPriority, DecisionImprovement } from "./models/decision-improvement.js";

export {
  PERSISTENT_MEMORY_SIGNAL_TYPES,
  persistentMemorySignalSchema,
  validatePersistentMemorySignal,
} from "./models/persistent-memory-signal.js";
export type {
  PersistentMemorySignalType,
  PersistentMemorySignal,
} from "./models/persistent-memory-signal.js";

export {
  persistentMemoryReportSchema,
  validatePersistentMemoryReport,
} from "./models/persistent-memory-report.js";
export type {
  PersistentMemoryReportId,
  PersistentMemoryReport,
  PersistentMemoryReportCreateInput,
} from "./models/persistent-memory-report.js";

export {
  persistentMemoryRecordSchema,
  validatePersistentMemoryRecord,
} from "./models/persistent-memory-record.js";
export type {
  PersistentMemoryRecordId,
  PersistentMemoryRecord,
  PersistentMemoryRecordCreateInput,
} from "./models/persistent-memory-record.js";

export type {
  PersistentMemoryIntelligenceRepositoryQuery,
  PersistentMemoryIntelligenceRepository,
} from "./repositories/persistent-memory-intelligence-repository.js";

export {
  InMemoryPersistentMemoryIntelligenceRepository,
  createInMemoryPersistentMemoryIntelligenceRepository,
} from "./repositories/in-memory-persistent-memory-intelligence-repository.js";

export {
  PERSISTENT_MEMORY_SIGNAL_WEIGHTS,
  generatePersistentMemory,
  persistentMemoryIntelligenceScoring,
} from "./scoring/persistent-memory-intelligence-scoring.js";
export type {
  PersistentMemoryBrandInput,
  PersistentMemoryContextInput,
  PersistentMemoryInput,
  PersistentMemoryBreakdown,
} from "./scoring/persistent-memory-intelligence-scoring.js";

export {
  PersistentMemoryIntelligenceEngine,
  defaultPersistentMemoryIntelligenceEngine,
} from "./engines/persistent-memory-intelligence-engine.js";

export {
  PERSISTENT_MEMORY_INTELLIGENCE_MODULE_ID,
  PERSISTENT_MEMORY_INTELLIGENCE_MODULE_VERSION,
  PERSISTENT_MEMORY_INTELLIGENCE_CAPABILITIES,
  PERSISTENT_MEMORY_INTELLIGENCE_MODULE_CONTRACT,
  PersistentMemoryIntelligenceModule,
  createPersistentMemoryIntelligenceModule,
  persistentMemoryIntelligenceModule,
} from "./contract/persistent-memory-intelligence-module.js";
export type {
  PersistentMemoryIntelligenceModuleId,
  PersistentMemoryIntelligenceCapability,
  PersistentMemoryIntelligenceModuleContract,
} from "./contract/persistent-memory-intelligence-module.js";
