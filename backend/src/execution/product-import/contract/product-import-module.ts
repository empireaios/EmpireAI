/**
 * Product Import module — imports supplier products into generated store catalogs.
 */

import {
  ProductImportEngine,
  defaultProductImportEngine,
  type ProductImportInput,
} from "../engines/product-import-engine.js";
import type { ProductImportRecord } from "../models/product-import-record.js";
import {
  importSupplierProducts,
  productImportScoring,
  type ProductImportStoreInput,
  type ProductImportSupplierItemInput,
} from "../scoring/product-import-scoring.js";
import type {
  ProductImportRepository,
  ProductImportRepositoryQuery,
} from "../repositories/product-import-repository.js";
import { createInMemoryProductImportRepository } from "../repositories/in-memory-product-import-repository.js";

export const PRODUCT_IMPORT_MODULE_ID = "product-import" as const;
export type ProductImportModuleId = typeof PRODUCT_IMPORT_MODULE_ID;

export const PRODUCT_IMPORT_MODULE_VERSION = "0.1.0" as const;

export type ProductImportCapability =
  | "product-import.import"
  | "product-import.score"
  | "product-import.persist"
  | "product-import.list";

export const PRODUCT_IMPORT_CAPABILITIES: readonly ProductImportCapability[] = [
  "product-import.import",
  "product-import.score",
  "product-import.persist",
  "product-import.list",
] as const;

export type ProductImportModuleContract = {
  moduleId: ProductImportModuleId;
  version: string;
  capabilities: readonly ProductImportCapability[];
};

export const PRODUCT_IMPORT_MODULE_CONTRACT: ProductImportModuleContract = {
  moduleId: PRODUCT_IMPORT_MODULE_ID,
  version: PRODUCT_IMPORT_MODULE_VERSION,
  capabilities: PRODUCT_IMPORT_CAPABILITIES,
};

/** Orchestrates supplier product import into generated stores. */
export class ProductImportModule {
  readonly contract = PRODUCT_IMPORT_MODULE_CONTRACT;
  private readonly engine: ProductImportEngine;

  constructor(
    private readonly repository: ProductImportRepository,
    engine?: ProductImportEngine,
  ) {
    this.engine = engine ?? new ProductImportEngine(repository);
  }

  importSupplierProducts = importSupplierProducts;
  scoring = productImportScoring;

  importProducts(input: ProductImportInput) {
    return this.engine.importProducts(input);
  }

  async persistProductImport(
    workspaceId: string,
    input: ProductImportInput,
  ): Promise<ProductImportRecord> {
    return this.engine.importAndSave(workspaceId, input);
  }

  async getProductImportRecord(
    workspaceId: string,
    recordId: string,
  ): Promise<ProductImportRecord | null> {
    return this.repository.getById(workspaceId, recordId);
  }

  async getProductImportByStore(
    workspaceId: string,
    storeId: string,
  ): Promise<ProductImportRecord | null> {
    return this.repository.getByStore(workspaceId, storeId);
  }

  async listProductImportRecords(
    workspaceId: string,
    filters: Omit<ProductImportRepositoryQuery, "workspaceId"> = {},
  ): Promise<ProductImportRecord[]> {
    return this.repository.list({ workspaceId, ...filters });
  }
}

/** Factory for a product import module with optional custom dependencies. */
export function createProductImportModule(
  repository: ProductImportRepository = createInMemoryProductImportRepository(),
  engine?: ProductImportEngine,
): ProductImportModule {
  return new ProductImportModule(repository, engine ?? new ProductImportEngine(repository));
}

export const productImportModule = createProductImportModule();

export type {
  ProductImportInput,
  ProductImportStoreInput,
  ProductImportSupplierItemInput,
};

export { defaultProductImportEngine };
