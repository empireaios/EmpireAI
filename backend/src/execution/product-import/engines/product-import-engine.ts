import type { ProductImportRecord } from "../models/product-import-record.js";
import type { ProductImportRepository } from "../repositories/product-import-repository.js";
import {
  importSupplierProducts,
  type ProductImportInput,
} from "../scoring/product-import-scoring.js";

/** Imports supplier products into generated store catalogs. */
export class ProductImportEngine {
  constructor(private readonly repository: ProductImportRepository) {}

  importProducts(input: ProductImportInput) {
    return importSupplierProducts(input);
  }

  async importAndSave(
    workspaceId: string,
    input: ProductImportInput,
  ): Promise<ProductImportRecord> {
    const breakdown = importSupplierProducts(input);
    return this.repository.save(workspaceId, breakdown);
  }
}

export const defaultProductImportEngine = {
  importProducts: importSupplierProducts,
};

export type { ProductImportInput };
