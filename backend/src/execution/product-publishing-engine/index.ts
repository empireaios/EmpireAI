export {
  PUBLISH_CATALOG_STATUSES,
  PUBLISHED_PRODUCT_STATUSES,
  PRODUCT_AVAILABILITY,
  publishedStoreProductSchema,
  catalogPublishRecordSchema,
  validateCatalogPublishRecord,
} from "./models/catalog-publish-record.js";
export type {
  PublishCatalogStatus,
  PublishedProductStatus,
  ProductAvailability,
  PublishedStoreProduct,
  CatalogPublishRecord,
} from "./models/catalog-publish-record.js";

export {
  loadProductPublishingEnv,
  isProductPublishingEnabled,
  isLiveSupplierSyncAllowed,
} from "./config/product-publishing-env.js";
export type { ProductPublishingEnv } from "./config/product-publishing-env.js";

export type { ProductPublishingRepository } from "./repositories/product-publishing-repository.js";
export {
  SqliteProductPublishingRepository,
  getProductPublishingRepository,
  resetProductPublishingRepository,
  createPublishRecord,
  createPublishedProductRecord,
} from "./repositories/sqlite-product-publishing-repository.js";

export {
  buildCatalogJson,
  buildCatalogStorefrontHtml,
} from "./services/storefront-catalog-builder.js";
export type { StorefrontCatalogInput } from "./services/storefront-catalog-builder.js";

export { fetchSupplierProductSnapshots } from "./services/supplier-snapshot-service.js";
export type { SupplierProductSnapshot } from "./services/supplier-snapshot-service.js";

export {
  ProductPublishingBlockedError,
  prepareCatalogPublish,
  publishCatalogToStorefront,
  syncPublishedInventory,
  syncPublishedPrices,
  syncPublishedAvailability,
  applyProductUpdates,
  getCatalogPublishById,
  getCatalogPublishByStoreId,
  listCatalogPublishes,
  listPublishedProducts,
  getPublishedProductById,
} from "./services/product-publishing-service.js";
export type {
  PrepareCatalogPublishInput,
  ProductUpdateInput,
} from "./services/product-publishing-service.js";

export { registerProductPublishingRoutes } from "./routes/product-publishing-routes.js";
export { productPublishingTools } from "./tools/product-publishing-tools.js";

export {
  PRODUCT_PUBLISHING_MODULE_ID,
  PRODUCT_PUBLISHING_CAPABILITIES,
  createProductPublishingModuleContract,
} from "./contract/product-publishing-module.js";
export type {
  ProductPublishingCapability,
  ProductPublishingModuleContract,
} from "./contract/product-publishing-module.js";
