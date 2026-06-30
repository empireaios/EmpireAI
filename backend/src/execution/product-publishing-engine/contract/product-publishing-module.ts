import type { CatalogPublishRecord, PublishedStoreProduct } from "../models/catalog-publish-record.js";
import type { ProductPublishingRepository } from "../repositories/product-publishing-repository.js";
import { getProductPublishingRepository } from "../repositories/sqlite-product-publishing-repository.js";

export const PRODUCT_PUBLISHING_MODULE_ID = "product-publishing" as const;

export type ProductPublishingCapability =
  | "product-publishing.prepare"
  | "product-publishing.publish"
  | "product-publishing.sync"
  | "product-publishing.update";

export const PRODUCT_PUBLISHING_CAPABILITIES: ProductPublishingCapability[] = [
  "product-publishing.prepare",
  "product-publishing.publish",
  "product-publishing.sync",
  "product-publishing.update",
];

export type ProductPublishingModuleContract = {
  moduleId: typeof PRODUCT_PUBLISHING_MODULE_ID;
  capabilities: ProductPublishingCapability[];
  repository: ProductPublishingRepository;
  getPublish(publishId: string): CatalogPublishRecord | null;
  listProducts(storeId: string): PublishedStoreProduct[];
};

export function createProductPublishingModuleContract(): ProductPublishingModuleContract {
  const repository = getProductPublishingRepository();
  return {
    moduleId: PRODUCT_PUBLISHING_MODULE_ID,
    capabilities: PRODUCT_PUBLISHING_CAPABILITIES,
    repository,
    getPublish: (publishId) => repository.getPublishById(publishId),
    listProducts: (storeId) => repository.listProductsByStoreId(storeId),
  };
}
