import type {
  CatalogPublishRecord,
  PublishedStoreProduct,
} from "../models/catalog-publish-record.js";

export interface ProductPublishingRepository {
  savePublish(record: CatalogPublishRecord): CatalogPublishRecord;
  getPublishById(publishId: string): CatalogPublishRecord | null;
  getPublishByStoreId(storeId: string): CatalogPublishRecord | null;
  listPublishes(workspaceId: string, companyId?: string): CatalogPublishRecord[];

  saveProduct(record: PublishedStoreProduct): PublishedStoreProduct;
  getProductById(publishedProductId: string): PublishedStoreProduct | null;
  listProductsByPublishId(publishId: string): PublishedStoreProduct[];
  listProductsByStoreId(storeId: string): PublishedStoreProduct[];
}
