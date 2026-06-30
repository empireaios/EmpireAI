import type { ProductImportRecord } from "../models/product-import-record.js";
import type { CatalogStatus } from "../models/catalog-status.js";

export type ProductImportRepositoryQuery = {
  workspaceId: string;
  storeId?: string;
  brandId?: string;
  generatedStorefrontId?: string;
  catalogStatus?: CatalogStatus;
  limit?: number;
  offset?: number;
};

/** Persistence contract for product import records. */
export type ProductImportRepository = {
  save(
    workspaceId: string,
    input: import("../models/product-import-record.js").ProductImportRecordCreateInput,
  ): Promise<ProductImportRecord>;
  getById(workspaceId: string, recordId: string): Promise<ProductImportRecord | null>;
  getByStore(workspaceId: string, storeId: string): Promise<ProductImportRecord | null>;
  list(query: ProductImportRepositoryQuery): Promise<ProductImportRecord[]>;
  delete(workspaceId: string, recordId: string): Promise<boolean>;
};
