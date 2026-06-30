export {
  supplierCatalogItemSchema,
  validateSupplierCatalogItem,
} from "./models/supplier-catalog-item.js";
export type { SupplierCatalogItemInput } from "./models/supplier-catalog-item.js";

export {
  supplierProductSchema,
  validateSupplierProduct,
} from "./models/supplier-product.js";
export type { SupplierProduct } from "./models/supplier-product.js";

export {
  supplierInventorySchema,
  validateSupplierInventory,
} from "./models/supplier-inventory.js";
export type { SupplierInventory } from "./models/supplier-inventory.js";

export {
  supplierPricingSchema,
  validateSupplierPricing,
} from "./models/supplier-pricing.js";
export type { SupplierPricing } from "./models/supplier-pricing.js";

export {
  supplierShippingMethodSchema,
  supplierShippingDataSchema,
  validateSupplierShippingData,
} from "./models/supplier-shipping-data.js";
export type { SupplierShippingMethod, SupplierShippingData } from "./models/supplier-shipping-data.js";

export {
  SUPPLIER_SYNC_SIGNAL_TYPES,
  supplierSyncSignalSchema,
  validateSupplierSyncSignal,
} from "./models/supplier-sync-signal.js";
export type { SupplierSyncSignalType, SupplierSyncSignal } from "./models/supplier-sync-signal.js";

export {
  supplierProductSyncRecordSchema,
  validateSupplierProductSyncRecord,
} from "./models/supplier-product-sync-record.js";
export type {
  SupplierProductSyncRecordId,
  SupplierProductSyncRecord,
  SupplierProductSyncRecordCreateInput,
} from "./models/supplier-product-sync-record.js";

export {
  SupplierProductKnowledgeGraphMapper,
  defaultSupplierProductKnowledgeGraphMapper,
} from "./mappers/supplier-product-knowledge-graph-mapper.js";

export type {
  SupplierProductSyncRepositoryQuery,
  SupplierProductSyncRepository,
} from "./repositories/supplier-product-sync-repository.js";

export {
  InMemorySupplierProductSyncRepository,
  createInMemorySupplierProductSyncRepository,
} from "./repositories/in-memory-supplier-product-sync-repository.js";

export {
  SUPPLIER_SYNC_SIGNAL_WEIGHTS,
  syncSupplierCatalogItem,
  syncSupplierCatalog,
  buildStubCatalogForPlatform,
  supplierProductSyncScoring,
} from "./scoring/supplier-product-sync-scoring.js";
export type {
  SupplierProductSyncInput,
  SupplierProductSyncBreakdown,
} from "./scoring/supplier-product-sync-scoring.js";

export {
  SupplierProductSyncEngine,
  defaultSupplierProductSyncEngine,
} from "./engines/supplier-product-sync-engine.js";

export {
  SUPPLIER_PRODUCT_SYNC_MODULE_ID,
  SUPPLIER_PRODUCT_SYNC_MODULE_VERSION,
  SUPPLIER_PRODUCT_SYNC_CAPABILITIES,
  SUPPLIER_PRODUCT_SYNC_MODULE_CONTRACT,
  SupplierProductSyncModule,
  createSupplierProductSyncModule,
  supplierProductSyncModule,
} from "./contract/supplier-product-sync-module.js";
export type {
  SupplierProductSyncModuleId,
  SupplierProductSyncCapability,
  SupplierProductSyncModuleContract,
} from "./contract/supplier-product-sync-module.js";
