import { z } from "zod";

import { supplierPlatformSchema, type SupplierPlatform } from "../../../suppliers/supplier-connector-framework/models/supplier-platform.js";

export const IMPORTED_PRODUCT_STATUSES = ["IMPORTED", "SKIPPED", "FAILED"] as const;

export type ImportedProductStatus = (typeof IMPORTED_PRODUCT_STATUSES)[number];

/** Supplier product imported into a generated store catalog. */
export type ImportedProduct = {
  importId: string;
  storeId: string;
  brandId: string;
  connectorId: string;
  platform: SupplierPlatform;
  supplierSku: string;
  productEntityId: string | null;
  title: string;
  description: string;
  retailPrice: number;
  compareAtPrice: number | null;
  currency: string;
  inventoryQuantity: number;
  status: ImportedProductStatus;
};

export const importedProductSchema = z.object({
  importId: z.string().min(1),
  storeId: z.string().min(1),
  brandId: z.string().min(1),
  connectorId: z.string().min(1),
  platform: supplierPlatformSchema,
  supplierSku: z.string().min(1),
  productEntityId: z.string().nullable(),
  title: z.string().min(1),
  description: z.string().min(1),
  retailPrice: z.number().min(0),
  compareAtPrice: z.number().min(0).nullable(),
  currency: z.string().length(3),
  inventoryQuantity: z.number().int().min(0),
  status: z.enum(IMPORTED_PRODUCT_STATUSES),
});

/** Validates an ImportedProduct record shape. */
export function validateImportedProduct(value: unknown): ImportedProduct {
  return importedProductSchema.parse(value);
}
