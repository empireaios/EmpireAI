import { z } from "zod";

import { catalogStatusSchema, type CatalogStatus } from "./catalog-status.js";
import { importedProductSchema, type ImportedProduct } from "./imported-product.js";
import { mappedProductSchema, type MappedProduct } from "./mapped-product.js";
import {
  productImportSignalSchema,
  type ProductImportSignal,
} from "./product-import-signal.js";

export type ProductImportRecordId = string;

/** Product import result for a generated store catalog. */
export type ProductImportRecord = {
  recordId: ProductImportRecordId;
  workspaceId: string;
  storeId: string;
  brandId: string;
  generatedStorefrontId: string | null;
  importedProducts: ImportedProduct[];
  mappedProducts: MappedProduct[];
  catalogStatus: CatalogStatus;
  confidence: number;
  signals: ProductImportSignal[];
  createdAt: string;
  updatedAt: string;
};

export type ProductImportRecordCreateInput = Omit<
  ProductImportRecord,
  "recordId" | "workspaceId" | "createdAt" | "updatedAt"
>;

const isoTimestamp = z.string().datetime({ offset: true });

export const productImportRecordSchema = z.object({
  recordId: z.string().min(1),
  workspaceId: z.string().min(1),
  storeId: z.string().min(1),
  brandId: z.string().min(1),
  generatedStorefrontId: z.string().nullable(),
  importedProducts: z.array(importedProductSchema),
  mappedProducts: z.array(mappedProductSchema),
  catalogStatus: catalogStatusSchema,
  confidence: z.number().min(0).max(100),
  signals: z.array(productImportSignalSchema),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates a ProductImportRecord record shape. */
export function validateProductImportRecord(value: unknown): ProductImportRecord {
  return productImportRecordSchema.parse(value);
}
