export {
  CATALOG_STATUSES,
  catalogStatusSchema,
  validateCatalogStatus,
} from "./models/catalog-status.js";
export type { CatalogStatus } from "./models/catalog-status.js";

export {
  IMPORTED_PRODUCT_STATUSES,
  importedProductSchema,
  validateImportedProduct,
} from "./models/imported-product.js";
export type { ImportedProductStatus, ImportedProduct } from "./models/imported-product.js";

export {
  MAPPED_PRODUCT_STATUSES,
  mappedProductSchema,
  validateMappedProduct,
} from "./models/mapped-product.js";
export type { MappedProductStatus, MappedProduct } from "./models/mapped-product.js";

export {
  PRODUCT_IMPORT_SIGNAL_TYPES,
  productImportSignalSchema,
  validateProductImportSignal,
} from "./models/product-import-signal.js";
export type { ProductImportSignalType, ProductImportSignal } from "./models/product-import-signal.js";

export {
  productImportRecordSchema,
  validateProductImportRecord,
} from "./models/product-import-record.js";
export type {
  ProductImportRecordId,
  ProductImportRecord,
  ProductImportRecordCreateInput,
} from "./models/product-import-record.js";

export type {
  ProductImportRepositoryQuery,
  ProductImportRepository,
} from "./repositories/product-import-repository.js";

export {
  InMemoryProductImportRepository,
  createInMemoryProductImportRepository,
} from "./repositories/in-memory-product-import-repository.js";

export {
  PRODUCT_IMPORT_SIGNAL_WEIGHTS,
  importSupplierProducts,
  productImportScoring,
} from "./scoring/product-import-scoring.js";
export type {
  ProductImportStoreInput,
  ProductImportSupplierItemInput,
  ProductImportInput,
  ProductImportBreakdown,
} from "./scoring/product-import-scoring.js";

export {
  ProductImportEngine,
  defaultProductImportEngine,
} from "./engines/product-import-engine.js";

export {
  PRODUCT_IMPORT_MODULE_ID,
  PRODUCT_IMPORT_MODULE_VERSION,
  PRODUCT_IMPORT_CAPABILITIES,
  PRODUCT_IMPORT_MODULE_CONTRACT,
  ProductImportModule,
  createProductImportModule,
  productImportModule,
} from "./contract/product-import-module.js";
export type {
  ProductImportModuleId,
  ProductImportCapability,
  ProductImportModuleContract,
} from "./contract/product-import-module.js";
