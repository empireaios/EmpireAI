import { z } from "zod";

export const MAPPED_PRODUCT_STATUSES = ["MAPPED", "UNMAPPED", "FAILED"] as const;

export type MappedProductStatus = (typeof MAPPED_PRODUCT_STATUSES)[number];

/** Mapping between an imported supplier product and a generated store catalog slot. */
export type MappedProduct = {
  mappingId: string;
  storeId: string;
  importId: string;
  supplierSku: string;
  productEntityId: string | null;
  storeProductHandle: string;
  collectionHandle: string;
  pageRoute: string;
  status: MappedProductStatus;
};

export const mappedProductSchema = z.object({
  mappingId: z.string().min(1),
  storeId: z.string().min(1),
  importId: z.string().min(1),
  supplierSku: z.string().min(1),
  productEntityId: z.string().nullable(),
  storeProductHandle: z.string().min(1),
  collectionHandle: z.string().min(1),
  pageRoute: z.string().min(1),
  status: z.enum(MAPPED_PRODUCT_STATUSES),
});

/** Validates a MappedProduct record shape. */
export function validateMappedProduct(value: unknown): MappedProduct {
  return mappedProductSchema.parse(value);
}
